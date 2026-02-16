/**
 * @description Predicates for validating parsed client message payloads.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isCoordinate(value: unknown): value is { x: number; y: number } {
  return (
    isRecord(value) &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    !Number.isNaN(value.x) &&
    !Number.isNaN(value.y)
  );
}

export function isOrientation(value: unknown): value is 0 | 90 | 180 | 270 {
  return value === 0 || value === 90 || value === 180 || value === 270;
}

export function isMeeplePlacement(
  value: unknown
): value is {
  tilePosition: { x: number; y: number };
  featureType: 'city' | 'road' | 'farm' | 'monastery' | 'garden';
  featureIndex: number;
} {
  return (
    isRecord(value) &&
    isCoordinate(value.tilePosition) &&
    isFeatureType(value.featureType) &&
    typeof value.featureIndex === 'number' &&
    Number.isInteger(value.featureIndex) &&
    value.featureIndex >= 0
  );
}

function isFeatureType(
  value: unknown
): value is 'city' | 'road' | 'farm' | 'monastery' | 'garden' {
  return (
    value === 'city' ||
    value === 'road' ||
    value === 'farm' ||
    value === 'monastery' ||
    value === 'garden'
  );
}
