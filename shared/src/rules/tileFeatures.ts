/**
 * @description Helpers for reading and rotating tile feature metadata.
 */
import type { Orientation, TileId } from '../types/game';
import {
  TILE_CATALOG,
  type Corner,
  type Edge,
  type EdgeType,
  type TileCatalogEntry
} from '../tiles';

const EDGE_ORDER: Edge[] = ['N', 'E', 'S', 'W'];
const CORNER_ORDER: Corner[] = ['NW', 'NE', 'SE', 'SW'];
const ORIENTATION_STEPS: Record<Orientation, number> = {
  0: 0,
  90: 1,
  180: 2,
  270: 3
};

export interface OrientedTileDefinition {
  tileId: TileId;
  orientation: Orientation;
  edges: Record<Edge, EdgeType>;
  cities: Array<{ edges: Edge[]; pennants: number }>;
  roads: Array<{ edges: Edge[] }>;
  farms: Array<{ corners: Corner[] }>;
  monastery: boolean;
  cityByEdge: Partial<Record<Edge, number>>;
  roadByEdge: Partial<Record<Edge, number>>;
  farmByCorner: Partial<Record<Corner, number>>;
}

export const EDGE_DELTAS: Record<
  Edge,
  { dx: number; dy: number; opposite: Edge }
> = {
  N: { dx: 0, dy: 1, opposite: 'S' },
  E: { dx: 1, dy: 0, opposite: 'W' },
  S: { dx: 0, dy: -1, opposite: 'N' },
  W: { dx: -1, dy: 0, opposite: 'E' }
};

export const CORNER_LINKS: Record<
  Corner,
  Array<{ edge: Edge; dx: number; dy: number; neighborCorner: Corner }>
> = {
  NW: [
    { edge: 'N', dx: 0, dy: 1, neighborCorner: 'SW' },
    { edge: 'W', dx: -1, dy: 0, neighborCorner: 'NE' }
  ],
  NE: [
    { edge: 'N', dx: 0, dy: 1, neighborCorner: 'SE' },
    { edge: 'E', dx: 1, dy: 0, neighborCorner: 'NW' }
  ],
  SE: [
    { edge: 'S', dx: 0, dy: -1, neighborCorner: 'NE' },
    { edge: 'E', dx: 1, dy: 0, neighborCorner: 'SW' }
  ],
  SW: [
    { edge: 'S', dx: 0, dy: -1, neighborCorner: 'NW' },
    { edge: 'W', dx: -1, dy: 0, neighborCorner: 'SE' }
  ]
};

const findTile = (
  tileId: TileId,
  catalog: TileCatalogEntry[]
): TileCatalogEntry | undefined => catalog.find((tile) => tile.id === tileId);

const rotateItems = <T extends string>(
  values: T[],
  order: readonly T[],
  orientation: Orientation
): T[] => {
  const steps = ORIENTATION_STEPS[orientation];
  return values.map((value) => {
    const index = order.indexOf(value);
    const nextIndex = (index + steps) % order.length;
    return order[nextIndex];
  });
};

export const rotateEdges = (
  edges: Record<Edge, EdgeType>,
  orientation: Orientation
): Record<Edge, EdgeType> => {
  const steps = ORIENTATION_STEPS[orientation];
  const rotated = {} as Record<Edge, EdgeType>;

  for (let index = 0; index < EDGE_ORDER.length; index += 1) {
    const edge = EDGE_ORDER[index];
    const sourceIndex = (index - steps + EDGE_ORDER.length) % EDGE_ORDER.length;
    rotated[edge] = edges[EDGE_ORDER[sourceIndex]];
  }

  return rotated;
};

export function getOrientedTileDefinition(
  tileId: TileId,
  orientation: Orientation,
  catalog: TileCatalogEntry[] = TILE_CATALOG
): OrientedTileDefinition | null {
  const tile = findTile(tileId, catalog);
  if (!tile) {
    return null;
  }

  const edges = rotateEdges(tile.features.edges, orientation);
  const cities = tile.features.cities.map((feature) => ({
    edges: rotateItems(feature.edges, EDGE_ORDER, orientation),
    pennants: feature.pennants
  }));
  const roads = tile.features.roads.map((feature) => ({
    edges: rotateItems(feature.edges, EDGE_ORDER, orientation)
  }));
  const farms = tile.features.farms.map((feature) => ({
    corners: rotateItems(feature.corners, CORNER_ORDER, orientation)
  }));

  const cityByEdge: Partial<Record<Edge, number>> = {};
  const roadByEdge: Partial<Record<Edge, number>> = {};
  const farmByCorner: Partial<Record<Corner, number>> = {};

  cities.forEach((feature, index) =>
    feature.edges.forEach((edge) => {
      cityByEdge[edge] = index;
    })
  );
  roads.forEach((feature, index) =>
    feature.edges.forEach((edge) => {
      roadByEdge[edge] = index;
    })
  );
  farms.forEach((feature, index) =>
    feature.corners.forEach((corner) => {
      farmByCorner[corner] = index;
    })
  );

  return {
    tileId,
    orientation,
    edges,
    cities,
    roads,
    farms,
    monastery: tile.features.monastery,
    cityByEdge,
    roadByEdge,
    farmByCorner
  };
}
