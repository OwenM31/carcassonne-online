/**
 * @description Shared utility helpers for MARTIN heuristic evaluation.
 */
import type {
  BoardState,
  Coordinate,
  MeeplePlacement,
  PlayerId
} from '@carcassonne/shared';

export interface RankedCandidate<T> {
  value: T;
  score: number;
  key: string;
  scoreDelta?: number;
}

export function countAdjacentTiles(board: BoardState, position: Coordinate): number {
  const neighbors = [
    { x: position.x, y: position.y - 1 },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x - 1, y: position.y }
  ];

  return neighbors.reduce((count, neighbor) => {
    return board.tiles[coordinateKey(neighbor)] ? count + 1 : count;
  }, 0);
}

export function meeplePlacementKey(placement: MeeplePlacement): string {
  return [
    placement.tilePosition.x,
    placement.tilePosition.y,
    placement.featureType,
    placement.featureIndex
  ].join(':');
}

export function pickBestCandidate<T>(
  candidates: RankedCandidate<T>[],
  tieSeed: string
): RankedCandidate<T> | null {
  let best: RankedCandidate<T> | null = null;
  let bestTieScore = Number.NEGATIVE_INFINITY;
  candidates.forEach((candidate) => {
    if (!best || candidate.score > best.score) {
      best = candidate;
      bestTieScore = tieBreakScore(tieSeed, candidate.key);
      return;
    }

    if (candidate.score < best.score) {
      return;
    }

    const tieScore = tieBreakScore(tieSeed, candidate.key);
    if (tieScore > bestTieScore) {
      best = candidate;
      bestTieScore = tieScore;
    }
  });

  return best;
}

export function buildTieSeed(
  game: { seed?: string; id: string; turnNumber: number },
  playerId: PlayerId,
  channel: 'place' | 'meeple'
): string {
  return `${game.seed ?? game.id}:${channel}:${game.turnNumber}:${playerId}`;
}

export function pickRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function coordinateKey(position: Coordinate): string {
  return `${position.x},${position.y}`;
}

function tieBreakScore(seed: string, key: string): number {
  const value = `${seed}:${key}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}
