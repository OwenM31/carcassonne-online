const fs = require('fs');
const { decodePngRgba } = require('./scripts/lib/png-rgba');

const sheetPath = 'client/public/tiles-river.png';
const png = decodePngRgba(fs.readFileSync(sheetPath));

const maxCol = 4;
const maxRow = 3;
const tileWidth = Math.floor(png.width / maxCol);
const tileHeight = Math.floor(png.height / maxRow);

// RV1_R1C3 is row 1, col 3
const tx = (3 - 1) * tileWidth;
const ty = (1 - 1) * tileHeight;

const seeds = [
  { name: 'N edge', x: 0.5, y: 0.05 },
  { name: 'E edge', x: 0.95, y: 0.5 },
  { name: 'S edge', x: 0.5, y: 0.95 },
  { name: 'W edge', x: 0.05, y: 0.5 }
];

console.log(`Checking RV1_R1C3 edges:`);
seeds.forEach(s => {
  const px = Math.floor(tx + s.x * tileWidth);
  const py = Math.floor(ty + s.y * tileHeight);
  const idx = (py * png.width + px) * 4;
  const r = png.pixels[idx];
  const g = png.pixels[idx + 1];
  const b = png.pixels[idx + 2];
  const a = png.pixels[idx + 3];
  console.log(`${s.name} at (${px}, ${py}): rgba(${r}, ${g}, ${b}, ${a})`);
});
