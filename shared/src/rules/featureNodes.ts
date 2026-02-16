/**
 * @description Feature-node builders used by connected component analysis.
 */
import type { BoardState, FeatureType } from '../types/game';
import { toFeatureKey } from './featureKeys';
import {
  countOpenEdges,
  countOpenMonasteryNeighbors,
  getEdgeFeatureNeighbors,
  getFarmAdjacentCityFeatureKeys,
  getFarmFeatureNeighbors
} from './featureNodeHelpers';
import {
  getOrientedTileDefinition,
  type OrientedTileDefinition
} from './tileFeatures';

export interface FeatureNode {
  key: string;
  type: FeatureType;
  tileKey: string;
  neighbors: string[];
  openEnds: number;
  pennants: number;
  inn: boolean;
  cathedral: boolean;
  adjacentCityFeatureKeys: string[];
}

export type TileDefinitionIndex = Record<string, OrientedTileDefinition>;

export function buildTileDefinitionIndex(board: BoardState): TileDefinitionIndex {
  const index: TileDefinitionIndex = {};

  Object.entries(board.tiles).forEach(([tileKey, tile]) => {
    const definition = getOrientedTileDefinition(tile.tileId, tile.orientation);
    if (definition) {
      index[tileKey] = definition;
    }
  });

  return index;
}

export function buildFeatureNodes(
  board: BoardState,
  tileDefinitions: TileDefinitionIndex
): Record<string, FeatureNode> {
  const nodes: Record<string, FeatureNode> = {};

  for (const [tileKey, tile] of Object.entries(board.tiles)) {
    const definition = tileDefinitions[tileKey];
    if (!definition) {
      continue;
    }

    definition.cities.forEach((feature, index) => {
      const key = toFeatureKey(tile.position, 'city', index);
      nodes[key] = {
        key,
        type: 'city',
        tileKey,
        neighbors: getEdgeFeatureNeighbors(
          tile.position,
          'city',
          feature.edges,
          tileDefinitions
        ),
        openEnds: countOpenEdges(tile.position, feature.edges, board),
        pennants: feature.pennants,
        inn: false,
        cathedral: feature.cathedral ?? false,
        adjacentCityFeatureKeys: []
      };
    });

    definition.roads.forEach((feature, index) => {
      const key = toFeatureKey(tile.position, 'road', index);
      nodes[key] = {
        key,
        type: 'road',
        tileKey,
        neighbors: getEdgeFeatureNeighbors(
          tile.position,
          'road',
          feature.edges,
          tileDefinitions
        ),
        openEnds: countOpenEdges(tile.position, feature.edges, board),
        pennants: 0,
        inn: feature.inn ?? false,
        cathedral: false,
        adjacentCityFeatureKeys: []
      };
    });

    definition.farms.forEach((feature, index) => {
      const key = toFeatureKey(tile.position, 'farm', index);
      nodes[key] = {
        key,
        type: 'farm',
        tileKey,
        neighbors: getFarmFeatureNeighbors(
          tile.position,
          feature.zones,
          definition,
          tileDefinitions
        ),
        openEnds: 0,
        pennants: 0,
        inn: false,
        cathedral: false,
        adjacentCityFeatureKeys: getFarmAdjacentCityFeatureKeys(
          tile.position,
          feature.zones,
          definition
        )
      };
    });

    if (definition.monastery) {
      const key = toFeatureKey(tile.position, 'monastery', 0);
      nodes[key] = {
        key,
        type: 'monastery',
        tileKey,
        neighbors: [],
        openEnds: countOpenMonasteryNeighbors(tile.position, board),
        pennants: 0,
        inn: false,
        cathedral: false,
        adjacentCityFeatureKeys: []
      };
    }

    if (definition.garden) {
      const key = toFeatureKey(tile.position, 'garden', 0);
      nodes[key] = {
        key,
        type: 'garden',
        tileKey,
        neighbors: [],
        openEnds: countOpenMonasteryNeighbors(tile.position, board),
        pennants: 0,
        inn: false,
        cathedral: false,
        adjacentCityFeatureKeys: []
      };
    }
  }

  return nodes;
}
