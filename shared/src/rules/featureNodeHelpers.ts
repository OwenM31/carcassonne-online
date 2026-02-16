/**
 * @description Helper calculations for feature-node construction.
 */
import type { BoardState, Coordinate } from '../types/game';
import type { FarmZone } from '../tiles';
import { toBoardKey } from './board';
import { toFeatureKey } from './featureKeys';
import {
  EDGE_DELTAS,
  FARM_ZONE_ADJACENT_EDGES,
  type OrientedTileDefinition
} from './tileFeatures';

const FARM_ZONE_LINKS: Record<
  FarmZone,
  Array<{ edge: keyof typeof EDGE_DELTAS; dx: number; dy: number; neighborZone: FarmZone }>
> = {
  NNW: [
    { edge: 'N', dx: 0, dy: 1, neighborZone: 'SSW' },
    { edge: 'W', dx: -1, dy: 0, neighborZone: 'ENE' }
  ],
  NNE: [
    { edge: 'N', dx: 0, dy: 1, neighborZone: 'SSE' },
    { edge: 'E', dx: 1, dy: 0, neighborZone: 'WNW' }
  ],
  ENE: [
    { edge: 'E', dx: 1, dy: 0, neighborZone: 'WNW' },
    { edge: 'N', dx: 0, dy: 1, neighborZone: 'SSE' }
  ],
  ESE: [
    { edge: 'E', dx: 1, dy: 0, neighborZone: 'WSW' },
    { edge: 'S', dx: 0, dy: -1, neighborZone: 'NNE' }
  ],
  SSE: [
    { edge: 'S', dx: 0, dy: -1, neighborZone: 'NNE' },
    { edge: 'E', dx: 1, dy: 0, neighborZone: 'WSW' }
  ],
  SSW: [
    { edge: 'S', dx: 0, dy: -1, neighborZone: 'NNW' },
    { edge: 'W', dx: -1, dy: 0, neighborZone: 'ENE' }
  ],
  WSW: [
    { edge: 'W', dx: -1, dy: 0, neighborZone: 'ESE' },
    { edge: 'S', dx: 0, dy: -1, neighborZone: 'NNW' }
  ],
  WNW: [
    { edge: 'W', dx: -1, dy: 0, neighborZone: 'ENE' },
    { edge: 'N', dx: 0, dy: 1, neighborZone: 'SSE' }
  ],
  CENTER: []
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
  zones: FarmZone[],
  definition: OrientedTileDefinition,
  tileDefinitions: Record<string, OrientedTileDefinition>
): string[] {
  const neighbors = new Set<string>();

  zones.forEach((zone) => {
    FARM_ZONE_LINKS[zone]?.forEach((link) => {
      if (definition.edges[link.edge] === 'city') {
        return;
      }

      const neighborPosition = { x: position.x + link.dx, y: position.y + link.dy };
      const neighborDefinition = tileDefinitions[toBoardKey(neighborPosition)];
      if (!neighborDefinition) {
        return;
      }

      if (neighborDefinition.edges[EDGE_DELTAS[link.edge].opposite] === 'city') {
        return;
      }

      const neighborFarmIndex = neighborDefinition.farmByZone[link.neighborZone];
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
  zones: FarmZone[],
  definition: OrientedTileDefinition
): string[] {
  const adjacentCities = new Set<string>();

  zones.forEach((zone) => {
    FARM_ZONE_ADJACENT_EDGES[zone]?.forEach((edge) => {
      if (definition.edges[edge] !== 'city') {
        return;
      }

      const cityIndex = definition.cityByEdge[edge];
      if (cityIndex === undefined) {
        return;
      }

      adjacentCities.add(toFeatureKey(position, 'city', cityIndex));
    });
  });

  return [...adjacentCities];
}
