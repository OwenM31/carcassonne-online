const fs = require('fs');
const { decodePngRgba } = require('./scripts/lib/png-rgba');

const sheetPath = 'client/public/tiles.png';
if (!fs.existsSync(sheetPath)) {
    console.error('File not found:', sheetPath);
    process.exit(1);
}
const png = decodePngRgba(fs.readFileSync(sheetPath));

const maxCol = 8;
const maxRow = 3;
const tileWidth = Math.floor(png.width / maxCol);
const tileHeight = Math.floor(png.height / maxRow);

// T_R1C2 is row 1, col 2
const tx = (2 - 1) * tileWidth;
const ty = (1 - 1) * tileHeight;

console.log(`TileWidth: ${tileWidth}, TileHeight: ${tileHeight}`);
console.log(`Tile Top-Left: (${tx}, ${ty})`);

const seeds = [
  { name: 'S edge (road)', x: 0.5, y: 0.95 }
];

seeds.forEach(s => {
  const px = Math.floor(tx + s.x * tileWidth);
  const py = Math.floor(ty + s.y * tileHeight);
  const idx = (py * png.width + px) * 4;
  const r = png.pixels[idx];
  const g = png.pixels[idx + 1];
  const b = png.pixels[idx + 2];
  const a = png.pixels[idx + 3];
  console.log(`${s.name} at (${px}, ${py}): rgba(${r}, ${g}, ${b}, ${a})`);
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  
  let type = 'null';
  if (g > r + 8 && g > b + 8) type = 'farm';
  else if (b > r + 3 && b > g - 10) type = 'water';
  else if (max < 100 && chroma < 20) type = 'road (dark gray)';
  else if (max >= 100 && chroma < 15) type = 'road (light gray)';
  else if (r > g && r > b && chroma <= 40 && max < 200) type = 'road (brownish)';
  else if (r > g + 5 && r > b - 20) type = 'city';
  
  console.log(`  Classified as: ${type}`);
});
