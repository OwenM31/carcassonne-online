/**
 * @description Shared keys for identifying feature instances on the board.
 */
import type { Coordinate, FeatureType } from '../types/game';

export function toFeatureKey(
  tilePosition: Coordinate,
  featureType: FeatureType,
  featureIndex: number
): string {
  return `${tilePosition.x},${tilePosition.y}:${featureType}:${featureIndex}`;
}
