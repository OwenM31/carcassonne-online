const fs = require('fs');
const { decodePngRgba } = require('./scripts/lib/png-rgba');

const sheetPath = 'client/public/tiles-abbot-river-2.png';
const png = decodePngRgba(fs.readFileSync(sheetPath));

// ABRV2_R1C2 is row 1, col 2.
const maxCol = 2;
const maxRow = 1;
const tileWidth = Math.floor(png.width / maxCol);
const tileHeight = Math.floor(png.height / maxRow);

const tx = (2 - 1) * tileWidth;
const ty = (1 - 1) * tileHeight;

console.log(`TileWidth: ${tileWidth}, TileHeight: ${tileHeight}`);
console.log(`Tile Top-Left: (${tx}, ${ty})`);

for (let x = 0; x < tileWidth; x += 10) {
  const idx = (ty * png.width + tx + x) * 4;
  const r = png.pixels[idx];
  const g = png.pixels[idx + 1];
  const b = png.pixels[idx + 2];
  const a = png.pixels[idx + 3];
  console.log(`Pixel at x=${x}, y=0: (${r}, ${g}, ${b}, ${a})`);
}
