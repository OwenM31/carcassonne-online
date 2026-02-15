/**
 * @description Helper predicates for validating game state payloads.
 */
import type {
  BoardState,
  Coordinate,
  GameState,
  PlacedMeeple,
  PlacedTile,
  PlayerState
} from '@carcassonne/shared';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isBoardState(value: unknown): value is BoardState {
  if (!isRecord(value) || !isRecord(value.tiles)) {
    return false;
  }

  const tiles = Object.values(value.tiles);
  if (tiles.some((tile) => !isPlacedTile(tile))) {
    return false;
  }

  if (!isRecord(value.bounds)) {
    return false;
  }

  const { minX, maxX, minY, maxY } = value.bounds;
  return (
    typeof minX === 'number' &&
    typeof maxX === 'number' &&
    typeof minY === 'number' &&
    typeof maxY === 'number'
  );
}

export function isPlacedTile(value: unknown): value is PlacedTile {
  return (
    isRecord(value) &&
    typeof value.tileId === 'string' &&
    isCoordinate(value.position) &&
    isOrientation(value.orientation)
  );
}

export function isCoordinate(value: unknown): value is Coordinate {
  return isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';
}

export function isPlayerState(value: unknown): value is PlayerState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isPlayerColor(value.color) &&
    typeof value.meeplesAvailable === 'number' &&
    typeof value.score === 'number'
  );
}

export function isPlacedMeeple(value: unknown): value is PlacedMeeple {
  return (
    isRecord(value) &&
    typeof value.playerId === 'string' &&
    isCoordinate(value.tilePosition) &&
    isFeatureType(value.featureType) &&
    typeof value.featureIndex === 'number' &&
    Number.isInteger(value.featureIndex) &&
    value.featureIndex >= 0
  );
}

export function isGameEvent(value: unknown): boolean {
  if (!isRecord(value) || !isGameEventType(value.type)) {
    return false;
  }

  if (typeof value.turn !== 'number' || Number.isNaN(value.turn)) {
    return false;
  }

  if (value.playerId !== undefined && typeof value.playerId !== 'string') {
    return false;
  }

  if (value.createdAt !== undefined && typeof value.createdAt !== 'string') {
    return false;
  }

  return typeof value.detail === 'string';
}

export function isGameStatus(value: unknown): value is GameState['status'] {
  return value === 'waiting' || value === 'active' || value === 'finished';
}

export function isTurnPhase(value: unknown): value is GameState['phase'] {
  return (
    value === 'setup' ||
    value === 'draw_tile' ||
    value === 'place_tile' ||
    value === 'place_meeple' ||
    value === 'scoring' ||
    value === 'game_over'
  );
}

export function isSessionMode(value: unknown): value is GameState['mode'] {
  return value === 'standard' || value === 'sandbox';
}

function isOrientation(value: unknown): value is PlacedTile['orientation'] {
  return value === 0 || value === 90 || value === 180 || value === 270;
}

function isPlayerColor(value: unknown): value is PlayerState['color'] {
  return (
    value === 'red' ||
    value === 'blue' ||
    value === 'green' ||
    value === 'yellow' ||
    value === 'black'
  );
}

function isFeatureType(value: unknown): boolean {
  return (
    value === 'city' ||
    value === 'road' ||
    value === 'farm' ||
    value === 'monastery'
  );
}

function isGameEventType(value: unknown): boolean {
  return (
    value === 'game_started' ||
    value === 'draw_tile' ||
    value === 'place_tile' ||
    value === 'place_meeple' ||
    value === 'skip_meeple' ||
    value === 'score' ||
    value === 'discard_tile' ||
    value === 'game_over'
  );
}
