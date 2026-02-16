/**
 * @description Helpers for rendering meeple indicators on top of board tiles.
 */
import type { FeatureType, MeepleKind, MeeplePlacement, PlacedTile } from '@carcassonne/shared';
import { getOrientedTileDefinition } from '@carcassonne/shared';

interface Anchor {
  xPercent: number;
  yPercent: number;
}

const EDGE_ANCHORS: Record<string, Anchor> = {
  N: { xPercent: 50, yPercent: 18 },
  E: { xPercent: 82, yPercent: 50 },
  S: { xPercent: 50, yPercent: 82 },
  W: { xPercent: 18, yPercent: 50 }
};

const FARM_ZONE_ANCHORS: Record<string, Anchor> = {
  NNW: { xPercent: 38, yPercent: 22 },
  NNE: { xPercent: 62, yPercent: 22 },
  ENE: { xPercent: 78, yPercent: 38 },
  ESE: { xPercent: 78, yPercent: 62 },
  SSE: { xPercent: 62, yPercent: 78 },
  SSW: { xPercent: 38, yPercent: 78 },
  WSW: { xPercent: 22, yPercent: 62 },
  WNW: { xPercent: 22, yPercent: 38 },
  CENTER: { xPercent: 50, yPercent: 50 }
};

const CENTER_ANCHOR: Anchor = { xPercent: 50, yPercent: 50 };

const TILE_ANCHOR_OVERRIDES: Record<string, Record<string, Anchor>> = {
  // Format: 'tileId': { 'type:index': { xPercent, yPercent } }
  "T_R1C1": { "farm:0": { "xPercent": 79, "yPercent": 79 } },
  "T_R1C2": { "road:0": { "xPercent": 41, "yPercent": 59 }, "farm:0": { "xPercent": 79, "yPercent": 21 } },
  "T_R1C6": { "farm:0": { "xPercent": 34, "yPercent": 89 }, "farm:1": { "xPercent": 66, "yPercent": 86 } },
  "T_R2C2": { "road:0": { "xPercent": 71, "yPercent": 64 }, "farm:1": { "xPercent": 84, "yPercent": 84 } },
  "T_R2C3": { "road:0": { "xPercent": 71, "yPercent": 64 }, "farm:1": { "xPercent": 84, "yPercent": 84 } },
  "T_R2C4": { "farm:0": { "xPercent": 51, "yPercent": 9 }, "farm:1": { "xPercent": 71, "yPercent": 86 } },
  "T_R2C5": { "farm:0": { "xPercent": 51, "yPercent": 9 }, "farm:1": { "xPercent": 71, "yPercent": 86 } },
  "T_R3C1": { "road:0": { "xPercent": 34, "yPercent": 59 } },
  "T_R3C2": { "road:0": { "xPercent": 61, "yPercent": 61 } },
  "T_R3C3": { "road:0": { "xPercent": 51, "yPercent": 59 }, "road:1": { "xPercent": 61, "yPercent": 64 }, "road:2": { "xPercent": 46, "yPercent": 74 }, "farm:0": { "xPercent": 61, "yPercent": 46 } },
  "T_R3C4": { "road:0": { "xPercent": 41, "yPercent": 54 }, "farm:0": { "xPercent": 86, "yPercent": 31 } },
  "T_R3C5": { "road:0": { "xPercent": 56, "yPercent": 56 } },
  "T_R3C6": { "road:0": { "xPercent": 46, "yPercent": 54 } },
  "T_R3C7": { "road:0": { "xPercent": 51, "yPercent": 46 }, "road:1": { "xPercent": 86, "yPercent": 46 }, "road:2": { "xPercent": 54, "yPercent": 64 } },
  "T_R3C8": { "road:1": { "xPercent": 61, "yPercent": 54 }, "road:2": { "xPercent": 41, "yPercent": 64 } },
  "IC_R1C1": { "road:0": { "xPercent": 66, "yPercent": 49 }, "road:1": { "xPercent": 36, "yPercent": 59 } },
  "IC_R1C5": { "farm:0": { "xPercent": 86, "yPercent": 34 } },
  "IC_R1C7": { "farm:0": { "xPercent": 89, "yPercent": 51 }, "farm:1": { "xPercent": 21, "yPercent": 79 } },
  "IC_R2C1": { "road:0": { "xPercent": 61, "yPercent": 21 } },
  "IC_R2C2": { "road:0": { "xPercent": 44, "yPercent": 19 }, "road:1": { "xPercent": 36, "yPercent": 69 }, "farm:0": { "xPercent": 66, "yPercent": 9 }, "farm:1": { "xPercent": 69, "yPercent": 84 }, "farm:2": { "xPercent": 41, "yPercent": 6 }, "farm:3": { "xPercent": 31, "yPercent": 86 } },
  "IC_R2C3": { "farm:1": { "xPercent": 51, "yPercent": 51 } },
  "IC_R2C4": { "farm:0": { "xPercent": 86, "yPercent": 34 } },
  "IC_R2C5": { "road:0": { "xPercent": 74, "yPercent": 71 }, "farm:0": { "xPercent": 89, "yPercent": 19 } },
  "IC_R2C6": { "road:0": { "xPercent": 44, "yPercent": 59 }, "road:1": { "xPercent": 61, "yPercent": 64 } },
  "IC_R2C7": { "road:0": { "xPercent": 59, "yPercent": 46 }, "farm:0": { "xPercent": 24, "yPercent": 79 }, "farm:1": { "xPercent": 74, "yPercent": 76 } },
  "IC_R2C8": { "road:0": { "xPercent": 49, "yPercent": 54 }, "farm:0": { "xPercent": 79, "yPercent": 69 } },
  "IC_R3C1": { "road:0": { "xPercent": 61, "yPercent": 44 }, "road:1": { "xPercent": 4, "yPercent": 54 }, "farm:3": { "xPercent": 14, "yPercent": 86 } },
  "RV1_R1C1": { "farm:1": { "xPercent": 64, "yPercent": 14 } },
  "RV1_R1C2": { "farm:1": { "xPercent": 81, "yPercent": 81 } },
  "RV1_R1C3": { "farm:1": { "xPercent": 11, "yPercent": 89 } },
  "RV1_R1C4": { "road:0": { "xPercent": 66, "yPercent": 26 }, "farm:1": { "xPercent": 84, "yPercent": 16 }, "farm:2": { "xPercent": 14, "yPercent": 89 } },
  "RV1_R2C1": { "farm:1": { "xPercent": 89, "yPercent": 86 } },
  "RV1_R2C2": { "road:0": { "xPercent": 49, "yPercent": 96 }, "farm:0": { "xPercent": 79, "yPercent": 21 }, "farm:1": { "xPercent": 11, "yPercent": 89 }, "farm:2": { "xPercent": 86, "yPercent": 86 } },
  "RV1_R2C3": { "farm:2": { "xPercent": 21, "yPercent": 84 }, "farm:3": { "xPercent": 84, "yPercent": 84 } },
  "RV1_R2C4": { "farm:0": { "xPercent": 14, "yPercent": 26 }, "farm:1": { "xPercent": 89, "yPercent": 79 } },
  "RV1_R3C1": { "road:0": { "xPercent": 41, "yPercent": 64 }, "farm:1": { "xPercent": 64, "yPercent": 14 }, "farm:3": { "xPercent": 16, "yPercent": 84 } },
  "RV1_R3C2": { "farm:0": { "xPercent": 24, "yPercent": 19 }, "farm:1": { "xPercent": 89, "yPercent": 14 } },
  "RV2_R1C1": { "farm:0": { "xPercent": 19, "yPercent": 19 } },
  "RV2_R1C2": { "farm:0": { "xPercent": 16, "yPercent": 16 }, "farm:2": { "xPercent": 76, "yPercent": 81 } },
  "RV2_R1C3": { "farm:1": { "xPercent": 84, "yPercent": 86 } },
  "RV2_R1C4": { "road:0": { "xPercent": 24, "yPercent": 36 }, "farm:1": { "xPercent": 86, "yPercent": 86 }, "farm:2": { "xPercent": 14, "yPercent": 14 } },
  "RV2_R2C1": { "farm:0": { "xPercent": 79, "yPercent": 31 }, "farm:1": { "xPercent": 14, "yPercent": 14 } },
  "RV2_R2C2": { "farm:1": { "xPercent": 84, "yPercent": 86 } },
  "RV2_R2C3": { "farm:0": { "xPercent": 81, "yPercent": 24 } },
  "RV2_R2C4": { "road:0": { "xPercent": 44, "yPercent": 49 }, "farm:2": { "xPercent": 19, "yPercent": 14 } },
  "RV2_R3C1": { "farm:0": { "xPercent": 79, "yPercent": 21 }, "farm:1": { "xPercent": 16, "yPercent": 84 } },
  "RV2_R3C2": { "road:0": { "xPercent": 29, "yPercent": 39 }, "farm:0": { "xPercent": 16, "yPercent": 16 }, "farm:1": { "xPercent": 89, "yPercent": 36 }, "farm:2": { "xPercent": 84, "yPercent": 71 }, "farm:3": { "xPercent": 19, "yPercent": 81 } },
  "RV2_R3C3": { "farm:0": { "xPercent": 16, "yPercent": 16 }, "farm:1": { "xPercent": 79, "yPercent": 21 } },
  "RV2_R3C4": { "farm:0": { "xPercent": 79, "yPercent": 21 } },
  "AB_R1C1": { "farm:0": { "xPercent": 76, "yPercent": 76 } },
  "AB_R1C2": { "farm:0": { "xPercent": 79, "yPercent": 59 } },
  "AB_R1C3": { "farm:0": { "xPercent": 41, "yPercent": 79 } },
  "AB_R2C1": { "farm:0": { "xPercent": 16, "yPercent": 51 } },
  "AB_R2C2": { "farm:0": { "xPercent": 26, "yPercent": 89 } },
  "AB_R2C3": { "road:0": { "xPercent": 61, "yPercent": 61 } },
  "AB_R2C4": { "farm:0": { "xPercent": 79, "yPercent": 61 } },
  "ABRV1_R1C1": { "farm:1": { "xPercent": 86, "yPercent": 86 } },
  "ABRV2_R1C1": { "farm:0": { "xPercent": 21, "yPercent": 79 }, "farm:1": { "xPercent": 89, "yPercent": 89 } },
  "ABRV2_R1C2": { "road:0": { "xPercent": 59, "yPercent": 51 }, "farm:0": { "xPercent": 14, "yPercent": 14 }, "farm:1": { "xPercent": 86, "yPercent": 14 } },
  "ABIC_R1C1": { "road:0": { "xPercent": 56, "yPercent": 56 }, "farm:0": { "xPercent": 16, "yPercent": 16 } }
};

const FEATURE_ROLES: Record<FeatureType, string> = {
  city: 'knight',
  road: 'highwayman',
  farm: 'farmer',
  monastery: 'monk',
  garden: 'abbot'
};

export function getMeepleRole(featureType: FeatureType): string {
  return FEATURE_ROLES[featureType];
}

export function getMeepleRoleLabel(featureType: FeatureType, kind: MeepleKind = 'normal'): string {
  const role = getMeepleRole(featureType);
  return kind === 'big' ? `big ${role}` : role;
}

export function getMeepleAnchor(placement: MeeplePlacement, tile: PlacedTile): Anchor {
  // Check overrides first (using unrotated IDs/indices as key base)
  const overrideKey = `${placement.featureType}:${placement.featureIndex}`;
  const tileOverrides = TILE_ANCHOR_OVERRIDES[tile.tileId];
  if (tileOverrides && tileOverrides[overrideKey]) {
    const anchor = tileOverrides[overrideKey];
    if (tile.orientation === 0) return anchor;

    // Rotate the override anchor to match rotateMask logic
    const { xPercent: x, yPercent: y } = anchor;
    if (tile.orientation === 90) return { xPercent: 100 - y, yPercent: x };
    if (tile.orientation === 180) return { xPercent: 100 - x, yPercent: 100 - y };
    if (tile.orientation === 270) return { xPercent: y, yPercent: 100 - x };
    return anchor;
  }

  const definition = getOrientedTileDefinition(tile.tileId, tile.orientation);
  if (!definition) {
    return CENTER_ANCHOR;
  }

  if (placement.featureType === 'monastery' || placement.featureType === 'garden') {
    return CENTER_ANCHOR;
  }

  if (placement.featureType === 'city') {
    const feature = definition.cities[placement.featureIndex];
    return averageAnchors(feature?.edges ?? [], EDGE_ANCHORS);
  }

  if (placement.featureType === 'road') {
    const feature = definition.roads[placement.featureIndex];
    return averageAnchors(feature?.edges ?? [], EDGE_ANCHORS);
  }

  const feature = definition.farms[placement.featureIndex];
  return averageAnchors(feature?.zones ?? [], FARM_ZONE_ANCHORS);
}

function averageAnchors(
  keys: string[],
  anchorMap: Record<string, Anchor>
): Anchor {
  if (keys.length === 0) {
    return CENTER_ANCHOR;
  }

  const total = keys.reduce(
    (sum, key) => ({
      xPercent: sum.xPercent + (anchorMap[key]?.xPercent ?? CENTER_ANCHOR.xPercent),
      yPercent: sum.yPercent + (anchorMap[key]?.yPercent ?? CENTER_ANCHOR.yPercent)
    }),
    { xPercent: 0, yPercent: 0 }
  );

  return {
    xPercent: total.xPercent / keys.length,
    yPercent: total.yPercent / keys.length
  };
}
