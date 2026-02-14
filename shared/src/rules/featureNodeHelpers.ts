/**
 * @description Helper calculations for feature-node construction.
 */
import type { BoardState, Coordinate } from '../types/game';
import { toBoardKey } from './board';
import { toFeatureKey } from './featureKeys';
import { CORNER_LINKS, EDGE_DELTAS, type OrientedTileDefinition } from './tileFeatures';

const CORNER_EDGES: Record<string, string[]> = {
  NW: ['N', 'W'],
  NE: ['N', 'E'],
  SE: ['S', 'E'],
  SW: ['S', 'W']
};

export function countOpenEdges(
  position: Coordinate,
  edges: string[],
  board: BoardState
): number {
  return edges.reduce((count, edge) => {
    const delta = EDGE_DELTAS[edge as keyof typeof EDGE_DELTAS];
    const neighborKey = toBoardKey({
      x: position.x + delta.dx,
      y: position.y + delta.dy
    });
    return board.tiles[neighborKey] ? count : count + 1;
  }, 0);
}

export function countOpenMonasteryNeighbors(
  position: Coordinate,
  board: BoardState
): number {
  let missing = 0;

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      if (!board.tiles[toBoardKey({ x: position.x + dx, y: position.y + dy })]) {
        missing += 1;
      }
    }
  }

  return missing;
}

export function getEdgeFeatureNeighbors(
  position: Coordinate,
  type: 'city' | 'road',
  edges: string[],
  tileDefinitions: Record<string, OrientedTileDefinition>
): string[] {
  const neighbors: string[] = [];

  edges.forEach((edge) => {
    const delta = EDGE_DELTAS[edge as keyof typeof EDGE_DELTAS];
    const neighborPosition = { x: position.x + delta.dx, y: position.y + delta.dy };
    const neighborDefinition = tileDefinitions[toBoardKey(neighborPosition)];
    if (!neighborDefinition) {
      return;
    }

    const index =
      type === 'city'
        ? neighborDefinition.cityByEdge[delta.opposite]
        : neighborDefinition.roadByEdge[delta.opposite];

    if (index === undefined) {
      return;
    }

    neighbors.push(toFeatureKey(neighborPosition, type, index));
  });

  return neighbors;
}

export function getFarmFeatureNeighbors(
  position: Coordinate,
  corners: string[],
  definition: OrientedTileDefinition,
  tileDefinitions: Record<string, OrientedTileDefinition>,
  board: BoardState
): string[] {
  const neighbors = new Set<string>();

  corners.forEach((corner) => {
    CORNER_LINKS[corner as keyof typeof CORNER_LINKS].forEach((link) => {
      if (definition.edges[link.edge] === 'city') {
        return;
      }

      const neighborPosition = { x: position.x + link.dx, y: position.y + link.dy };
      if (!board.tiles[toBoardKey(neighborPosition)]) {
        return;
      }

      const neighborDefinition = tileDefinitions[toBoardKey(neighborPosition)];
      if (!neighborDefinition) {
        return;
      }

      if (neighborDefinition.edges[EDGE_DELTAS[link.edge].opposite] === 'city') {
        return;
      }

      const neighborFarmIndex = neighborDefinition.farmByCorner[link.neighborCorner];
      if (neighborFarmIndex === undefined) {
        return;
      }

      neighbors.add(toFeatureKey(neighborPosition, 'farm', neighborFarmIndex));
    });
  });

  return [...neighbors];
}

export function getFarmAdjacentCityFeatureKeys(
  position: Coordinate,
  corners: string[],
  definition: OrientedTileDefinition
): string[] {
  const adjacentCities = new Set<string>();

  corners.forEach((corner) => {
    CORNER_EDGES[corner]?.forEach((edge) => {
      if (definition.edges[edge as keyof typeof definition.edges] !== 'city') {
        return;
      }

      const cityIndex = definition.cityByEdge[edge as keyof typeof definition.cityByEdge];
      if (cityIndex === undefined) {
        return;
      }

      adjacentCities.add(toFeatureKey(position, 'city', cityIndex));
    });
  });

  return [...adjacentCities];
}
