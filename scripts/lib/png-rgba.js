/**
 * @description Minimal RGBA PNG decode/encode helpers for sprite tooling.
 */
const zlib = require('node:zlib');

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePngRgba(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) {
    throw new Error('Invalid PNG signature.');
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
    const data = buffer.subarray(offset, offset + length);
    offset += length + 4;

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

  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    throw new Error(`Unsupported PNG format (bitDepth=${bitDepth}, colorType=${colorType}).`);
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const expectedLength = (stride + 1) * height;
  if (raw.length !== expectedLength) {
    throw new Error(`Unexpected inflated length ${raw.length}; expected ${expectedLength}.`);
  }

  const pixels = Buffer.alloc(width * height * channels);
  const previous = Buffer.alloc(stride);
  const reconstructed = Buffer.alloc(stride);
  let inOffset = 0;
  let outOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filterType = raw[inOffset++];
    for (let x = 0; x < stride; x += 1) {
      const rawByte = raw[inOffset++];
      const left = x >= channels ? reconstructed[x - channels] : 0;
      const up = previous[x];
      const upLeft = x >= channels ? previous[x - channels] : 0;
      let value = rawByte;
      if (filterType === 1) value = (rawByte + left) & 0xff;
      if (filterType === 2) value = (rawByte + up) & 0xff;
      if (filterType === 3) value = (rawByte + Math.floor((left + up) / 2)) & 0xff;
      if (filterType === 4) value = (rawByte + paethPredictor(left, up, upLeft)) & 0xff;
      reconstructed[x] = value;
    }
    if (channels === 4) {
      reconstructed.copy(pixels, outOffset);
    } else {
      for (let x = 0; x < width; x += 1) {
        const src = x * 3;
        const dst = outOffset + x * 4;
        pixels[dst] = reconstructed[src];
        pixels[dst + 1] = reconstructed[src + 1];
        pixels[dst + 2] = reconstructed[src + 2];
        pixels[dst + 3] = 255;
      }
    }
    reconstructed.copy(previous);
    outOffset += width * 4;
  }

  return { width, height, pixels };
}

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = buildCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function encodePngRgba(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (stride + 1);
    raw[rowOffset] = 0;
    pixels.copy(raw, rowOffset + 1, y * stride, y * stride + stride);
  }
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

module.exports = {
  decodePngRgba,
  encodePngRgba
};
