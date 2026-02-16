const fs = require('fs');
const { decodePngRgba } = require('./scripts/lib/png-rgba');

const sheetPath = 'client/public/tiles.png';
const png = decodePngRgba(fs.readFileSync(sheetPath));

const maxCol = 8;
const maxRow = 3;
const tileWidth = Math.floor(png.width / maxCol);
const tileHeight = Math.floor(png.height / maxRow);

// T_R1C1 is row 1, col 1
const tx = (1 - 1) * tileWidth;
const ty = (1 - 1) * tileHeight;

console.log(`Checking T_R1C1 farm (N edge):`);
const x = Math.floor(tileWidth / 2);
const y = 5;
const idx = ((ty + y) * png.width + (tx + x)) * 4;
const r = png.pixels[idx];
const g = png.pixels[idx + 1];
const b = png.pixels[idx + 2];
const a = png.pixels[idx + 3];
const max = Math.max(r, g, b);
const min = Math.min(r, g, b);
const chroma = max - min;
console.log(`Pixel at x=${x}, y=${y}: rgba(${r}, ${g}, ${b}, ${a}) chroma=${chroma} max=${max} g-r=${g-r} g-b=${g-b}`);
