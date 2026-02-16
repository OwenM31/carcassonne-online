/**
 * @description Exports transparent meeple, big-meeple, builder, pig, and abbot sprites.
 */
const fs = require('node:fs');
const path = require('node:path');
const { decodePngRgba, encodePngRgba } = require('./lib/png-rgba');

const SOURCE_PATH = path.resolve('client/public/meeples-sheet.png');
const OUTPUT_DIR = path.resolve('client/public/meeples');
const COLOR_ORDER = ['black', 'red', 'yellow', 'green', 'blue', 'gray', 'pink'];
const PREVIEW_GAP = 8;
const WHITE_THRESHOLD = 236;
const WHITE_DELTA = 16;

const SPRITE_GROUPS = [
  {
    key: 'normal',
    y: 116,
    width: 27,
    height: 28,
    xByColor: [29, 66, 104, 142, 180, 218, 256],
    filenamePrefix: '',
    previewFile: 'preview-strip.png'
  },
  {
    key: 'big',
    y: 115,
    width: 31,
    height: 31,
    xByColor: [316, 354, 392, 430, 470, 508, 546],
    filenamePrefix: 'big-',
    previewFile: 'preview-strip-big.png'
  },
  {
    key: 'builder',
    y: 179,
    width: 27,
    height: 37,
    xByColor: [29, 67, 104, 143, 180, 217, 256],
    filenamePrefix: 'builder-',
    previewFile: 'preview-strip-builder.png'
  },
  {
    key: 'pig',
    y: 187,
    width: 33,
    height: 19,
    xByColor: [315, 354, 393, 430, 469, 508, 547],
    filenamePrefix: 'pig-',
    previewFile: 'preview-strip-pig.png'
  },
  {
    key: 'abbot',
    y: 376,
    width: 28,
    height: 36,
    xByColor: [317, 356, 394, 434, 471, 510, 548],
    filenamePrefix: 'abbot-',
    previewFile: 'preview-strip-abbot.png'
  }
];

function isNearWhite(r, g, b) {
  return (
    r >= WHITE_THRESHOLD &&
    g >= WHITE_THRESHOLD &&
    b >= WHITE_THRESHOLD &&
    Math.abs(r - g) <= WHITE_DELTA &&
    Math.abs(r - b) <= WHITE_DELTA &&
    Math.abs(g - b) <= WHITE_DELTA
  );
}

function exportGroup(source, group) {
  const previewWidth =
    COLOR_ORDER.length * group.width + (COLOR_ORDER.length + 1) * PREVIEW_GAP;
  const previewHeight = group.height + PREVIEW_GAP * 2;
  const previewPixels = Buffer.alloc(previewWidth * previewHeight * 4);
  const urlsByColor = {};

  for (let index = 0; index < COLOR_ORDER.length; index += 1) {
    const color = COLOR_ORDER[index];
    const sourceX = group.xByColor[index];
    if (sourceX === undefined) {
      throw new Error(`Missing x-coordinate for ${group.key} ${color}.`);
    }

    const spritePixels = Buffer.alloc(group.width * group.height * 4);
    const previewX = PREVIEW_GAP + index * (group.width + PREVIEW_GAP);
    const previewY = PREVIEW_GAP;

    for (let y = 0; y < group.height; y += 1) {
      for (let xOffset = 0; xOffset < group.width; xOffset += 1) {
        const sourceIndex = ((group.y + y) * source.width + (sourceX + xOffset)) * 4;
        const spriteIndex = (y * group.width + xOffset) * 4;
        const r = source.pixels[sourceIndex];
        const g = source.pixels[sourceIndex + 1];
        const b = source.pixels[sourceIndex + 2];
        const a = source.pixels[sourceIndex + 3];
        const alpha = isNearWhite(r, g, b) ? 0 : a;

        spritePixels[spriteIndex] = r;
        spritePixels[spriteIndex + 1] = g;
        spritePixels[spriteIndex + 2] = b;
        spritePixels[spriteIndex + 3] = alpha;

        const previewIndex = ((previewY + y) * previewWidth + (previewX + xOffset)) * 4;
        previewPixels[previewIndex] = r;
        previewPixels[previewIndex + 1] = g;
        previewPixels[previewIndex + 2] = b;
        previewPixels[previewIndex + 3] = alpha;
      }
    }

    const filename = `${group.filenamePrefix}${color}.png`;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, filename),
      encodePngRgba(group.width, group.height, spritePixels)
    );
    urlsByColor[color] = `/meeples/${filename}`;
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, group.previewFile),
    encodePngRgba(previewWidth, previewHeight, previewPixels)
  );

  return {
    key: group.key,
    width: group.width,
    height: group.height,
    preview: `/meeples/${group.previewFile}`,
    colors: urlsByColor
  };
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const source = decodePngRgba(fs.readFileSync(SOURCE_PATH));

  const manifest = {
    source: '/meeples-sheet.png',
    generatedAt: new Date().toISOString(),
    groups: {}
  };

  for (const group of SPRITE_GROUPS) {
    const groupManifest = exportGroup(source, group);
    manifest.groups[group.key] = groupManifest;
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  console.log(`Exported ${SPRITE_GROUPS.length} sprite groups to ${OUTPUT_DIR}`);
}

main();
