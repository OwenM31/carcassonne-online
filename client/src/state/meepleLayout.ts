/**
 * @description Helpers for rendering meeple indicators on top of board tiles.
 */
import type { FeatureType, MeeplePlacement, PlacedTile } from '@carcassonne/shared';
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

const CORNER_ANCHORS: Record<string, Anchor> = {
  NW: { xPercent: 28, yPercent: 28 },
  NE: { xPercent: 72, yPercent: 28 },
  SE: { xPercent: 72, yPercent: 72 },
  SW: { xPercent: 28, yPercent: 72 }
};

const CENTER_ANCHOR: Anchor = { xPercent: 50, yPercent: 50 };
const FEATURE_ROLES: Record<FeatureType, string> = {
  city: 'knight',
  road: 'highwayman',
  farm: 'farmer',
  monastery: 'monk'
};

export function getMeepleRole(featureType: FeatureType): string {
  return FEATURE_ROLES[featureType];
}

export function getMeepleAnchor(placement: MeeplePlacement, tile: PlacedTile): Anchor {
  const definition = getOrientedTileDefinition(tile.tileId, tile.orientation);
  if (!definition) {
    return CENTER_ANCHOR;
  }

  if (placement.featureType === 'monastery') {
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
  return averageAnchors(feature?.corners ?? [], CORNER_ANCHORS);
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
