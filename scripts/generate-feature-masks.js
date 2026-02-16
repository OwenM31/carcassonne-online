const fs = require('node:fs');
const path = require('node:path');
const { decodePngRgba } = require('./lib/png-rgba');
const { FULL_TILE_CATALOG } = require('../shared/dist/index');

const MASK_SIZE = 40;
const OUTPUT_PATH = path.join(__dirname, '../client/src/state/featureMasks.json');

function classifyPixel(r, g, b, a) {
  if (a < 80) return null;
  if (r > 245 && g > 245 && b > 245) return null;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;

  if (g > r + 5 && g > b + 20) return 'farm';
  if (b > r + 3 && b > g - 10) return 'water';
  
  // Refined road detection:
  // - Dark gray roads (low max, low chroma)
  if (max < 100 && chroma < 20) return 'road';
  // - Light gray / tan roads (high max, low/medium chroma)
  if (max >= 100 && chroma < 35) return 'road';
  // - Brownish roads (medium chroma, reddish)
  if (r > g && r > b && chroma <= 52 && max < 240) return 'road';
  // - Greenish roads (medium chroma, greenish) - common in some expansion sets
  if (g >= r && g > b && chroma <= 65 && max < 240) return 'road';

  if (r > g + 5 && r > b + 20) return 'city';
  if (chroma > 30 && r > 80 && g > 80 && b < 150) return 'garden_exclusion';
  
  return null;
}

const EDGE_SEEDS = {
  N: { x: 0.5, y: 0.05 },
  E: { x: 0.95, y: 0.5 },
  S: { x: 0.5, y: 0.95 },
  W: { x: 0.05, y: 0.5 }
};

const FARM_ZONE_SEEDS = {
  NNW: { x: 0.35, y: 0.05 },
  NNE: { x: 0.65, y: 0.05 },
  ENE: { x: 0.95, y: 0.35 },
  ESE: { x: 0.95, y: 0.65 },
  SSE: { x: 0.65, y: 0.95 },
  SSW: { x: 0.35, y: 0.95 },
  WSW: { x: 0.05, y: 0.65 },
  WNW: { x: 0.05, y: 0.35 },
  CENTER: { x: 0.5, y: 0.5 }
};

const CENTER_COORD = { x: 0.5, y: 0.5 };

class MinHeap {
  constructor() { this.heap = []; }
  push(val) {
    this.heap.push(val);
    this.bubbleUp();
  }
  pop() {
    if (this.size() === 1) return this.heap.pop();
    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown();
    return top;
  }
  size() { return this.heap.length; }
  bubbleUp() {
    let idx = this.heap.length - 1;
    while (idx > 0) {
      let parent = Math.floor((idx - 1) / 2);
      if (this.heap[idx].cost >= this.heap[parent].cost) break;
      [this.heap[idx], this.heap[parent]] = [this.heap[parent], this.heap[idx]];
      idx = parent;
    }
  }
  bubbleDown() {
    let idx = 0;
    while (true) {
      let left = 2 * idx + 1, right = 2 * idx + 2, small = idx;
      if (left < this.heap.length && this.heap[left].cost < this.heap[small].cost) small = left;
      if (right < this.heap.length && this.heap[right].cost < this.heap[small].cost) small = right;
      if (small === idx) break;
      [this.heap[idx], this.heap[small]] = [this.heap[small], this.heap[idx]];
      idx = small;
    }
  }
}

function partitionTilePixels(tilePixels, width, height, tile) {
  const allFeatureSeeds = [];
  tile.features.cities.forEach((f, i) => allFeatureSeeds.push({ type: 'city', fIdx: i, logicalSeeds: f.edges.map(e => EDGE_SEEDS[e]) }));
  tile.features.roads.forEach((f, i) => {
    const logicalSeeds = f.edges.map(e => EDGE_SEEDS[e]);
    // Add center seed for junction-heavy and bridge tiles to ensure road masks meet and block farms
    if (tile.label.includes('road_t') || tile.label.includes('road_cross') || tile.label.includes('bridge') || f.edges.length > 2) {
      logicalSeeds.push(CENTER_COORD);
    }
    allFeatureSeeds.push({ type: 'road', fIdx: i, logicalSeeds });
  });
  tile.features.farms.forEach((f, i) => allFeatureSeeds.push({ type: 'farm', fIdx: i, logicalSeeds: f.zones.map(z => FARM_ZONE_SEEDS[z]) }));
  
  if (tile.features.monastery) allFeatureSeeds.push({ type: 'monastery_exclusion', fIdx: 0, logicalSeeds: [CENTER_COORD] });
  if (tile.features.garden) allFeatureSeeds.push({ type: 'garden_exclusion', fIdx: 0, logicalSeeds: [CENTER_COORD] });

  Object.entries(tile.features.edges).forEach(([edge, type]) => {
    if (type === 'river') {
      allFeatureSeeds.push({ type: 'river_exclusion', fIdx: 0, logicalSeeds: [EDGE_SEEDS[edge]] });
    }
  });

  const pixelTypes = new Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    pixelTypes[i] = classifyPixel(tilePixels[idx], tilePixels[idx + 1], tilePixels[idx + 2], tilePixels[idx + 3]);
  }

  const pq = new MinHeap();
  const costs = new Float32Array(width * height).fill(Infinity);
  const assignment = new Int16Array(width * height).fill(-1);

  allFeatureSeeds.forEach((fs, sIdx) => {
    fs.logicalSeeds.forEach(ls => {
      const sxBase = Math.floor(ls.x * width);
      const syBase = Math.floor(ls.y * height);
      
      // Find the nearest pixel of matching type
      let bestX = sxBase, bestY = syBase, minDistSq = Infinity;
      const searchRadius = Math.floor(width * 0.15);
      
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          const nx = sxBase + dx, ny = syBase + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = ny * width + nx;
            const pType = pixelTypes[idx];
            const match = pType === fs.type || (fs.type === 'river_exclusion' && pType === 'water');
            if (match) {
              const d2 = dx * dx + dy * dy;
              if (d2 < minDistSq) {
                minDistSq = d2;
                bestX = nx;
                bestY = ny;
              }
            }
          }
        }
      }
      
      if (minDistSq === Infinity) {
        console.warn(`Warning: Seed for ${fs.type} on ${tile.id} at ${ls.x},${ls.y} failed to find matching pixel (base type: ${pixelTypes[syBase * width + sxBase]})`);
      }
      
      const idx = bestY * width + bestX;
      costs[idx] = 0;
      pq.push({ x: bestX, y: bestY, cost: 0, sIdx });
    });
  });

  const logicalTypesOnTile = new Set(allFeatureSeeds.map(fs => fs.type));

  while (pq.size() > 0) {
    const { x, y, cost, sIdx } = pq.pop();
    const idx = y * width + x;
    if (cost > costs[idx]) continue;
    if (assignment[idx] !== -1) continue;
    assignment[idx] = sIdx;

    const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (assignment[nidx] !== -1) continue;
        
        const targetType = pixelTypes[nidx];
        const seedType = allFeatureSeeds[sIdx].type;
        const isExclusion = seedType.endsWith('_exclusion');
        
        let stepCost = 1.0;
        const targetMatches = targetType === seedType || 
                             (seedType === 'river_exclusion' && targetType === 'water') ||
                             (seedType === 'garden_exclusion' && targetType === 'garden_exclusion');

        if (targetMatches) {
          stepCost = 0.5;
        } else if (isExclusion) {
          // Exclusions can grow through anything nearby relatively cheaply 
          stepCost = 2.0;
        } else {
          // Tunneling logic
          const isOtherLogicalFeature = targetType && logicalTypesOnTile.has(targetType) && targetType !== seedType;
          if (isOtherLogicalFeature) {
            stepCost = 100.0;
          } else {
            stepCost = 10.0; 
          }
        }
        
        const newCost = cost + stepCost;
        if (newCost < costs[nidx]) {
          costs[nidx] = newCost;
          pq.push({ x: nx, y: ny, cost: newCost, sIdx });
        }
      }
    }
  }

  const downsampledVisited = new Int16Array(MASK_SIZE * MASK_SIZE).fill(-1);
  for (let my = 0; my < MASK_SIZE; my++) {
    for (let mx = 0; mx < MASK_SIZE; mx++) {
      const xStart = Math.floor((mx * width) / MASK_SIZE);
      const xEnd = Math.ceil(((mx + 1) * width) / MASK_SIZE);
      const yStart = Math.floor((my * height) / MASK_SIZE);
      const yEnd = Math.ceil(((my + 1) * height) / MASK_SIZE);
      const counts = new Array(allFeatureSeeds.length).fill(0);
      let total = 0;
      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = y * width + x;
          const sIdx = assignment[idx];
          if (sIdx !== -1) {
             const fs = allFeatureSeeds[sIdx];
             if (fs.type.endsWith('_exclusion')) {
               counts[sIdx]++;
             } else {
               const targetType = pixelTypes[idx];
               if (targetType === fs.type || !targetType) counts[sIdx]++;
             }
          }
          total++;
        }
      }
      let bestSIdx = -1, maxCount = 0;
      for (let sIdx = 0; sIdx < counts.length; sIdx++) {
        if (counts[sIdx] > maxCount) { maxCount = counts[sIdx]; bestSIdx = sIdx; }
      }
      if (bestSIdx !== -1 && maxCount > total * 0.05) downsampledVisited[my * MASK_SIZE + mx] = bestSIdx;
    }
  }

  const finalDownsampled = new Int16Array(downsampledVisited);
  for (let i = 0; i < 2; i++) {
    for (let y = 1; y < MASK_SIZE - 1; y++) {
      for (let x = 1; x < MASK_SIZE - 1; x++) {
        const idx = y * MASK_SIZE + x;
        if (finalDownsampled[idx] === -1) {
          if (finalDownsampled[idx-1] !== -1 && finalDownsampled[idx-1] === finalDownsampled[idx+1]) finalDownsampled[idx] = finalDownsampled[idx-1];
          else if (finalDownsampled[idx-MASK_SIZE] !== -1 && finalDownsampled[idx-MASK_SIZE] === finalDownsampled[idx+MASK_SIZE]) finalDownsampled[idx] = finalDownsampled[idx-MASK_SIZE];
        }
      }
    }
  }

  const results = { city: [], road: [], farm: [] };
  allFeatureSeeds.forEach((fs, sIdx) => {
    if (fs.type.endsWith('_exclusion')) return;
    const bytes = new Uint8Array(Math.ceil((MASK_SIZE * MASK_SIZE) / 8));
    for (let i = 0; i < MASK_SIZE * MASK_SIZE; i++) {
      if (finalDownsampled[i] === sIdx) bytes[Math.floor(i / 8)] |= 1 << (i % 8);
    }
    results[fs.type].push(Buffer.from(bytes).toString('base64'));
  });
  return results;
}

async function run() {
  const results = {};
  const tilesBySheet = {};
  for (const tile of FULL_TILE_CATALOG) {
    if (!tilesBySheet[tile.source.sheet]) tilesBySheet[tile.source.sheet] = [];
    tilesBySheet[tile.source.sheet].push(tile);
  }
  for (const [sheetName, tiles] of Object.entries(tilesBySheet)) {
    const sheetPath = path.join(__dirname, '../client/public', sheetName);
    if (!fs.existsSync(sheetPath)) continue;
    const png = decodePngRgba(fs.readFileSync(sheetPath));
    const maxCol = Math.max(...tiles.map((t) => t.source.col));
    const maxRow = Math.max(...tiles.map((t) => t.source.row));
    const tileWidth = Math.floor(png.width / maxCol);
    const tileHeight = Math.floor(png.height / maxRow);
    for (const tile of tiles) {
      const tx = (tile.source.col - 1) * tileWidth;
      const ty = (tile.source.row - 1) * tileHeight;
      const tilePixels = Buffer.alloc(tileWidth * tileHeight * 4);
      for (let y = 0; y < tileHeight; y++) {
        const srcOffset = ((ty + y) * png.width + tx) * 4;
        png.pixels.copy(tilePixels, y * tileWidth * 4, srcOffset, srcOffset + tileWidth * 4);
      }
      results[tile.id] = partitionTilePixels(tilePixels, tileWidth, tileHeight, tile);
    }
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ maskSize: MASK_SIZE, masks: results }, null, 2));
}
run().catch(console.error);
