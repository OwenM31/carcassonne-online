const fs = require('fs');
const { decodePngRgba } = require('./scripts/lib/png-rgba');

const sheetPath = 'client/public/tiles-river.png';
const png = decodePngRgba(fs.readFileSync(sheetPath));

const maxCol = 4;
const maxRow = 3;
const tileWidth = Math.floor(png.width / maxCol);
const tileHeight = Math.floor(png.height / maxRow);

// RV1_R2C2 is row 2, col 2
const tx = (2 - 1) * tileWidth;
const ty = (2 - 1) * tileHeight;

console.log(`Scanning South edge middle pixels colors for RV1_R2C2:`);
for (let y = tileHeight - 5; y < tileHeight; y++) {
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
