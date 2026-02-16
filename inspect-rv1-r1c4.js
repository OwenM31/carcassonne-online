const fs = require('fs');
const { decodePngRgba } = require('./scripts/lib/png-rgba');

const sheetPath = 'client/public/tiles-river.png';
if (!fs.existsSync(sheetPath)) {
    console.error('File not found:', sheetPath);
    process.exit(1);
}
const png = decodePngRgba(fs.readFileSync(sheetPath));

const maxCol = 4;
const maxRow = 3;
const tileWidth = Math.floor(png.width / maxCol);
const tileHeight = Math.floor(png.height / maxRow);

// RV1_R1C4 is row 1, col 4
const tx = (4 - 1) * tileWidth;
const ty = (1 - 1) * tileHeight;

console.log(`TileWidth: ${tileWidth}, TileHeight: ${tileHeight}`);
console.log(`Tile Top-Left: (${tx}, ${ty})`);

const seeds = [
  { name: 'N edge (road)', x: 0.5, y: 0.05 },
  { name: 'E edge (road)', x: 0.95, y: 0.5 },
  { name: 'S edge (river)', x: 0.5, y: 0.95 },
  { name: 'W edge (river)', x: 0.05, y: 0.5 }
];

  console.log(`Scanning North edge middle pixels colors:`);
  for (let y = 0; y < 5; y++) {
    const x = Math.floor(tileWidth / 2);
    const idx = ((ty + y) * png.width + (tx + x)) * 4;
    const r = png.pixels[idx];
    const g = png.pixels[idx + 1];
    const b = png.pixels[idx + 2];
    const a = png.pixels[idx + 3];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    console.log(`Pixel at x=${x}, y=${y}: rgba(${r}, ${g}, ${b}, ${a}) chroma=${chroma} max=${max}`);
  }
