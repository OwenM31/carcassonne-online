import featureMasksData from './featureMasks.json';

export interface TileFeatureMasks {
  city: string[];
  road: string[];
  farm: string[];
}

export const FEATURE_MASKS: Record<string, TileFeatureMasks> = featureMasksData.masks;
export const MASK_SIZE = featureMasksData.maskSize;

/**
 * @description Decodes a base64 bitmask into a set of coordinates.
 */
export function decodeMask(maskBase64: string): boolean[] {
  const binaryString = atob(maskBase64);
  const result: boolean[] = new Array(MASK_SIZE * MASK_SIZE).fill(false);
  
  for (let i = 0; i < binaryString.length; i++) {
    const byte = binaryString.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) {
      const index = i * 8 + bit;
      if (index < result.length) {
        result[index] = !!(byte & (1 << bit));
      }
    }
  }
  
  return result;
}

/**
 * @description Rotates a mask by a given orientation (0, 90, 180, 270).
 */
export function rotateMask(mask: boolean[], orientation: number): boolean[] {
  if (orientation === 0) return mask;
  const size = MASK_SIZE;
  const result: boolean[] = new Array(mask.length).fill(false);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let nx = x;
      let ny = y;
      
      if (orientation === 90) {
        nx = size - 1 - y;
        ny = x;
      } else if (orientation === 180) {
        nx = size - 1 - x;
        ny = size - 1 - y;
      } else if (orientation === 270) {
        nx = y;
        ny = size - 1 - x;
      }
      
      result[ny * size + nx] = mask[y * size + x];
    }
  }
  
  return result;
}

/**
 * @description Converts a mask to an SVG path data string.
 */
export function maskToPathData(mask: boolean[], scale: number): string {
  let path = '';
  const cellSize = scale / MASK_SIZE;
  
  for (let y = 0; y < MASK_SIZE; y++) {
    for (let x = 0; x < MASK_SIZE; x++) {
      if (mask[y * MASK_SIZE + x]) {
        const xPos = x * cellSize;
        const yPos = y * cellSize;
        path += `M${xPos.toFixed(2)},${yPos.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `;
      }
    }
  }
  
  return path;
}

