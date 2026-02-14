const fs = require('node:fs');
const zlib = require('node:zlib');

const args = process.argv.slice(2);
const filePath = args.find((arg) => !arg.startsWith('--')) ?? 'tiles.png';
const shouldExport = args.includes('--export');
const shouldSprite = args.includes('--sprite');
const scaleArg = args.find((arg) => arg.startsWith('--scale='));
const exportScale = scaleArg ? Number(scaleArg.split('=')[1]) : 1;
const spriteOutArg = args.find((arg) => arg.startsWith('--sprite-out='));
const spritePaddingArg = args.find((arg) => arg.startsWith('--padding='));
const spriteOutPath = spriteOutArg
  ? spriteOutArg.split('=')[1]
  : 'client/public/tiles.png';
const spritePadding = spritePaddingArg ? Number(spritePaddingArg.split('=')[1]) : 0;

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buffer) {
  const signature = buffer.slice(0, 8);
  const expected = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!signature.equals(expected)) {
    throw new Error('Not a PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.toString('ascii', offset, offset + 4);
    offset += 4;
    const data = buffer.slice(offset, offset + length);
    offset += length;
    offset += 4; // CRC

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8) {
    throw new Error(`Unsupported bit depth: ${bitDepth}`);
  }

  if (![2, 6].includes(colorType)) {
    throw new Error(`Unsupported color type: ${colorType}`);
  }

  const channels = colorType === 6 ? 4 : 3;
  const bytesPerPixel = channels;
  const stride = width * bytesPerPixel;
  const compressed = Buffer.concat(idatChunks);
  const raw = zlib.inflateSync(compressed);
  const expectedLength = (stride + 1) * height;

  if (raw.length !== expectedLength) {
    throw new Error(`Unexpected raw data length: ${raw.length} (expected ${expectedLength})`);
  }

  const pixels = Buffer.alloc(height * stride);
  const prior = Buffer.alloc(stride);
  const recon = Buffer.alloc(stride);
  let inOffset = 0;
  let outOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filterType = raw[inOffset++];

    for (let x = 0; x < stride; x += 1) {
      const rawByte = raw[inOffset++];
      const left = x >= bytesPerPixel ? recon[x - bytesPerPixel] : 0;
      const up = prior[x];
      const upLeft = x >= bytesPerPixel ? prior[x - bytesPerPixel] : 0;
      let value;

      switch (filterType) {
        case 0:
          value = rawByte;
          break;
        case 1:
          value = (rawByte + left) & 0xff;
          break;
        case 2:
          value = (rawByte + up) & 0xff;
          break;
        case 3:
          value = (rawByte + Math.floor((left + up) / 2)) & 0xff;
          break;
        case 4:
          value = (rawByte + paethPredictor(left, up, upLeft)) & 0xff;
          break;
        default:
          throw new Error(`Unsupported filter type: ${filterType}`);
      }

      recon[x] = value;
    }

    recon.copy(pixels, outOffset);
    recon.copy(prior);
    outOffset += stride;
  }

  return { width, height, channels, data: pixels };
}

function getPixel(png, x, y) {
  const { width, channels, data } = png;
  const index = (y * width + x) * channels;
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const a = channels === 4 ? data[index + 3] : 255;
  return { r, g, b, a };
}

function isBackground(pixel) {
  return pixel.r > 250 && pixel.g > 250 && pixel.b > 250;
}

function classifyPixel(pixel) {
  const { r, g, b } = pixel;

  if (isBackground(pixel)) {
    return '.';
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max > 140 && max - min < 35) {
    return 'R'; // road-ish (light gray)
  }

  if (g > r + 12 && g > b + 12) {
    return 'F'; // farm
  }

  if (r > g + 10 && r > b + 10) {
    return 'C'; // city-ish
  }

  if (r > 150 && g > 120 && b < 140) {
    return 'C';
  }

  return 'X';
}

function findComponents(png) {
  const { width, height } = png;
  const visited = new Uint8Array(width * height);
  const components = [];
  const stackX = [];
  const stackY = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      const pixel = getPixel(png, x, y);
      if (isBackground(pixel)) {
        visited[idx] = 1;
        continue;
      }

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let area = 0;

      stackX.push(x);
      stackY.push(y);
      visited[idx] = 1;

      while (stackX.length) {
        const cx = stackX.pop();
        const cy = stackY.pop();
        area += 1;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (visited[nIdx]) continue;
          const nPixel = getPixel(png, nx, ny);
          if (isBackground(nPixel)) {
            visited[nIdx] = 1;
            continue;
          }
          visited[nIdx] = 1;
          stackX.push(nx);
          stackY.push(ny);
        }
      }

      components.push({ minX, maxX, minY, maxY, area });
    }
  }

  return components;
}

const png = decodePng(fs.readFileSync(filePath));
const components = findComponents(png)
  .filter((component) => component.area > 5000)
  .sort((a, b) => (a.minY - b.minY) || (a.minX - b.minX));

console.log(`Detected ${components.length} large components`);

const tiles = components.slice(0, 24);
if (tiles.length !== 24) {
  console.log('Warning: expected 24 tiles');
}

const tileGrid = tiles
  .map((tile) => ({
    ...tile,
    centerY: (tile.minY + tile.maxY) / 2,
    centerX: (tile.minX + tile.maxX) / 2
  }))
  .sort((a, b) => (a.centerY - b.centerY) || (a.centerX - b.centerX));

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const rows = chunk(tileGrid, 8);
const spriteTiles = [];

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = buildCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    const byte = buffer[i];
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function writePng(filePath, width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLength = width * 3;
  const raw = Buffer.alloc((rowLength + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (rowLength + 1);
    raw[rowStart] = 0;
    const pixelStart = y * rowLength;
    pixels.copy(raw, rowStart + 1, pixelStart, pixelStart + rowLength);
  }

  const compressed = zlib.deflateSync(raw);
  const chunks = [
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ];

  fs.writeFileSync(filePath, Buffer.concat([signature, ...chunks]));
}

rows.forEach((row, rowIndex) => {
  row.sort((a, b) => a.centerX - b.centerX);
  row.forEach((tile, colIndex) => {
    const width = tile.maxX - tile.minX + 1;
    const height = tile.maxY - tile.minY + 1;
    console.log(`\nTile R${rowIndex + 1}C${colIndex + 1} (${width}x${height}) bounds x:${tile.minX}-${tile.maxX} y:${tile.minY}-${tile.maxY}`);

    const edgeSampleCount = 25;
    const edgeOffset = Math.floor(Math.min(width, height) * 0.08);
    const edgeStats = {
      N: { C: 0, R: 0, F: 0, X: 0 },
      E: { C: 0, R: 0, F: 0, X: 0 },
      S: { C: 0, R: 0, F: 0, X: 0 },
      W: { C: 0, R: 0, F: 0, X: 0 }
    };

    for (let i = 0; i < edgeSampleCount; i += 1) {
      const t = (i + 0.5) / edgeSampleCount;
      const x = Math.round(tile.minX + edgeOffset + t * (width - 1 - 2 * edgeOffset));
      const y = Math.round(tile.minY + edgeOffset + t * (height - 1 - 2 * edgeOffset));

      const northPixel = getPixel(png, x, tile.minY + edgeOffset);
      const southPixel = getPixel(png, x, tile.maxY - edgeOffset);
      const westPixel = getPixel(png, tile.minX + edgeOffset, y);
      const eastPixel = getPixel(png, tile.maxX - edgeOffset, y);

      edgeStats.N[classifyPixel(northPixel)] += 1;
      edgeStats.S[classifyPixel(southPixel)] += 1;
      edgeStats.W[classifyPixel(westPixel)] += 1;
      edgeStats.E[classifyPixel(eastPixel)] += 1;
    }

    function summarizeEdge(stats) {
      if (stats.R >= 2) return 'R';
      if (stats.C >= 4) return 'C';
      return 'F';
    }

    const edgeSummary = {
      N: summarizeEdge(edgeStats.N),
      E: summarizeEdge(edgeStats.E),
      S: summarizeEdge(edgeStats.S),
      W: summarizeEdge(edgeStats.W)
    };

    console.log(`Edges N:${edgeSummary.N} E:${edgeSummary.E} S:${edgeSummary.S} W:${edgeSummary.W}`);
    console.log(`Edge counts N:${JSON.stringify(edgeStats.N)} E:${JSON.stringify(edgeStats.E)} S:${JSON.stringify(edgeStats.S)} W:${JSON.stringify(edgeStats.W)}`);

    if (shouldExport || shouldSprite) {
      const cropWidth = width;
      const cropHeight = height;
      const cropPixels = Buffer.alloc(cropWidth * cropHeight * 3);
      for (let y = 0; y < cropHeight; y += 1) {
        for (let x = 0; x < cropWidth; x += 1) {
          const pixel = getPixel(png, tile.minX + x, tile.minY + y);
          const index = (y * cropWidth + x) * 3;
          cropPixels[index] = pixel.r;
          cropPixels[index + 1] = pixel.g;
          cropPixels[index + 2] = pixel.b;
        }
      }

      const scaledWidth = cropWidth * exportScale;
      const scaledHeight = cropHeight * exportScale;
      const scaledPixels = Buffer.alloc(scaledWidth * scaledHeight * 3);

      for (let y = 0; y < scaledHeight; y += 1) {
        const srcY = Math.floor(y / exportScale);
        for (let x = 0; x < scaledWidth; x += 1) {
          const srcX = Math.floor(x / exportScale);
          const srcIndex = (srcY * cropWidth + srcX) * 3;
          const dstIndex = (y * scaledWidth + x) * 3;
          scaledPixels[dstIndex] = cropPixels[srcIndex];
          scaledPixels[dstIndex + 1] = cropPixels[srcIndex + 1];
          scaledPixels[dstIndex + 2] = cropPixels[srcIndex + 2];
        }
      }

      if (shouldExport) {
        const exportDir = exportScale > 1 ? `tmp/tiles-x${exportScale}` : 'tmp/tiles';
        if (!fs.existsSync(exportDir)) {
          fs.mkdirSync(exportDir, { recursive: true });
        }

        const fileName = `${exportDir}/r${rowIndex + 1}c${colIndex + 1}.png`;
        writePng(fileName, scaledWidth, scaledHeight, scaledPixels);
      }

      if (shouldSprite) {
        spriteTiles.push({
          rowIndex,
          colIndex,
          width: scaledWidth,
          height: scaledHeight,
          pixels: scaledPixels
        });
      }
    }

    const gridSize = 15;
    for (let gy = 0; gy < gridSize; gy += 1) {
      let line = '';
      const py = Math.round(tile.minY + (gy + 0.5) * (height / gridSize));
      for (let gx = 0; gx < gridSize; gx += 1) {
        const px = Math.round(tile.minX + (gx + 0.5) * (width / gridSize));
        const pixel = getPixel(png, px, py);
        line += classifyPixel(pixel);
      }
      console.log(line);
    }
  });
});

if (shouldSprite) {
  const maxWidth = spriteTiles.reduce((max, tile) => Math.max(max, tile.width), 0);
  const maxHeight = spriteTiles.reduce((max, tile) => Math.max(max, tile.height), 0);
  const cellSize = Math.max(maxWidth, maxHeight) + Math.max(spritePadding, 0) * 2;
  const sheetWidth = cellSize * 8;
  const sheetHeight = cellSize * rows.length;
  const sheetPixels = Buffer.alloc(sheetWidth * sheetHeight * 3, 255);

  for (const tile of spriteTiles) {
    const offsetX = tile.colIndex * cellSize + Math.floor((cellSize - tile.width) / 2);
    const offsetY = tile.rowIndex * cellSize + Math.floor((cellSize - tile.height) / 2);

    for (let y = 0; y < tile.height; y += 1) {
      for (let x = 0; x < tile.width; x += 1) {
        const srcIndex = (y * tile.width + x) * 3;
        const dstIndex = ((offsetY + y) * sheetWidth + (offsetX + x)) * 3;
        sheetPixels[dstIndex] = tile.pixels[srcIndex];
        sheetPixels[dstIndex + 1] = tile.pixels[srcIndex + 1];
        sheetPixels[dstIndex + 2] = tile.pixels[srcIndex + 2];
      }
    }
  }

  writePng(spriteOutPath, sheetWidth, sheetHeight, sheetPixels);
  console.log(`\nWrote sprite sheet to ${spriteOutPath} (${sheetWidth}x${sheetHeight})`);
}
