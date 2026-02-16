/**
 * @description Integration tests for feature mask accuracy and connectivity.
 */
import { FEATURE_MASKS, MASK_SIZE, decodeMask, rotateMask } from '../src/state/featureMasks';
import { getMeepleAnchor } from '../src/state/meepleLayout';
import { FULL_TILE_CATALOG, type PlacedTile, type FeatureType, type Orientation } from '@carcassonne/shared';

describe('featureHighlighting', () => {
  function checkAnchorInMask(tileId: string, type: FeatureType, index: number, orientation: Orientation = 0) {
    const tileMasks = FEATURE_MASKS[tileId];
    if (!tileMasks) return false;

    const maskBase64 = (tileMasks as any)[type]?.[index];
    if (!maskBase64) return false;

    const mask = rotateMask(decodeMask(maskBase64), orientation);
    
    const tile: PlacedTile = { tileId, position: { x: 0, y: 0 }, orientation };
    const anchor = getMeepleAnchor({ featureType: type, featureIndex: index, tilePosition: { x: 0, y: 0 } }, tile);
    
    const gx = Math.floor((anchor.xPercent / 100) * MASK_SIZE);
    const gy = Math.floor((anchor.yPercent / 100) * MASK_SIZE);
    
    // Check anchor pixel and its neighbors to account for small offsets/downsampling artifacts
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx >= 0 && nx < MASK_SIZE && ny >= 0 && ny < MASK_SIZE && mask[ny * MASK_SIZE + nx]) {
          return true;
        }
      }
    }
    
    return false;
  }

  it('captures logical anchors in the generated masks for base tiles', () => {
    // Test a few iconic tiles
    expect(checkAnchorInMask('T_R1C2', 'road', 0)).toBe(true); // Monastery road
    expect(checkAnchorInMask('T_R2C6', 'city', 0)).toBe(true); // Separate city 1
    expect(checkAnchorInMask('T_R2C6', 'city', 1)).toBe(true); // Separate city 2
  });

  it('ensures separate city features on T_R2C6 have non-overlapping masks', () => {
    const masks = FEATURE_MASKS['T_R2C6'].city;
    const m1 = decodeMask(masks[0]);
    const m2 = decodeMask(masks[1]);
    
    let overlaps = 0;
    for (let i = 0; i < m1.length; i++) {
      if (m1[i] && m2[i]) overlaps++;
    }
    expect(overlaps).toBe(0);
  });

  it('ensures separate farm features on T_R3C7 have non-overlapping masks', () => {
    const masks = FEATURE_MASKS['T_R3C7'].farm;
    const m1 = decodeMask(masks[0]); // Top
    const m2 = decodeMask(masks[1]); // Bottom-left
    const m3 = decodeMask(masks[2]); // Bottom-right
    
    for (let i = 0; i < m1.length; i++) {
      expect(m1[i] && m2[i]).toBe(false);
      expect(m1[i] && m3[i]).toBe(false);
      expect(m2[i] && m3[i]).toBe(false);
    }
  });

  it('ensures separate farm features on T_R1C7 have non-overlapping masks', () => {
    const masks = FEATURE_MASKS['T_R1C7'].farm;
    const m1 = decodeMask(masks[0]);
    const m2 = decodeMask(masks[1]);
    for (let i = 0; i < m1.length; i++) {
      expect(m1[i] && m2[i]).toBe(false);
    }
  });

  it('ensures separate farm features on RV1_R2C2 have non-overlapping masks', () => {
    const masks = FEATURE_MASKS['RV1_R2C2'].farm;
    const m1 = decodeMask(masks[0]);
    const m2 = decodeMask(masks[1]);
    const m3 = decodeMask(masks[2]);
    for (let i = 0; i < m1.length; i++) {
      expect(m1[i] && m2[i]).toBe(false);
      expect(m1[i] && m3[i]).toBe(false);
      expect(m2[i] && m3[i]).toBe(false);
    }
  });

  it('ensures separate farm features on RV2_R2C2 have non-overlapping masks', () => {
    const masks = FEATURE_MASKS['RV2_R2C2'].farm;
    const m1 = decodeMask(masks[0]);
    const m2 = decodeMask(masks[1]);
    for (let i = 0; i < m1.length; i++) {
      expect(m1[i] && m2[i]).toBe(false);
    }
  });

  it('excludes the garden area from the city mask in AB_R2C2', () => {
    const cityMask = decodeMask(FEATURE_MASKS['AB_R2C2'].city[0]);
    // The center of AB_R2C2 is a garden, it should NOT be in the city mask
    // We check a 3x3 area around center to be sure
    const centerIdx = Math.floor(MASK_SIZE / 2);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        expect(cityMask[(centerIdx + dy) * MASK_SIZE + (centerIdx + dx)]).toBe(false);
      }
    }
  });

  it('ensures separate farm features on RV2_R2C3 (around city bridge) have correct masks', () => {
    const masks = FEATURE_MASKS['RV2_R2C3'].farm;
    expect(masks.length).toBe(2);
    
    const topFarm = decodeMask(masks[0]);
    const bottomFarm = decodeMask(masks[1]);
    
    // RV2_R2C3 has city at N and S edges, and horizontal river.
    // Grass exists in the "bands" between the river and the cities.
    // Check for some highlight in the top-half band (y=5..15) and bottom-half band (y=25..35)
    let topCount = 0;
    for (let y = 5; y < 15; y++) {
      for (let x = 0; x < MASK_SIZE; x++) {
        if (topFarm[y * MASK_SIZE + x]) topCount++;
      }
    }

    let bottomCount = 0;
    for (let y = 25; y < 35; y++) {
      for (let x = 0; x < MASK_SIZE; x++) {
        if (bottomFarm[y * MASK_SIZE + x]) bottomCount++;
      }
    }
    expect(topCount).toBeGreaterThan(5);
    expect(bottomCount).toBeGreaterThan(5);
  });
});
