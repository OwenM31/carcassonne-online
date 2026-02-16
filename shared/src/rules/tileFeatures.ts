/**
 * @description Helpers for reading and rotating tile feature metadata.
 */
import type { Orientation, TileId } from '../types/game';
import {
  FULL_TILE_CATALOG,
  type Edge,
  type EdgeType,
  type FarmZone,
  type TileCatalogEntry
} from '../tiles';

const EDGE_ORDER: Edge[] = ['N', 'E', 'S', 'W'];
const FARM_ZONE_ORDER: FarmZone[] = [
  'NNW',
  'NNE',
  'ENE',
  'ESE',
  'SSE',
  'SSW',
  'WSW',
  'WNW'
];
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
  cities: Array<{ edges: Edge[]; pennants: number; cathedral?: boolean }>;
  roads: Array<{ edges: Edge[]; inn?: boolean }>;
  farms: Array<{ zones: FarmZone[] }>;
  monastery: boolean;
  garden: boolean;
  cityByEdge: Partial<Record<Edge, number>>;
  roadByEdge: Partial<Record<Edge, number>>;
  farmByZone: Partial<Record<FarmZone, number>>;
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

export const FARM_ZONE_ADJACENT_EDGES: Record<FarmZone, Edge[]> = {
  NNW: ['N', 'W'],
  NNE: ['N', 'E'],
  ENE: ['E', 'N'],
  ESE: ['E', 'S'],
  SSE: ['S', 'E'],
  SSW: ['S', 'W'],
  WSW: ['W', 'S'],
  WNW: ['W', 'N'],
  CENTER: ['N', 'E', 'S', 'W']
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

const rotateFarmZones = (zones: FarmZone[], orientation: Orientation): FarmZone[] => {
  const steps = ORIENTATION_STEPS[orientation] * 2;
  return zones.map((zone) => {
    if (zone === 'CENTER') {
      return 'CENTER';
    }

    const index = FARM_ZONE_ORDER.indexOf(zone);
    if (index < 0) {
      return zone;
    }

    const nextIndex = (index + steps) % FARM_ZONE_ORDER.length;
    return FARM_ZONE_ORDER[nextIndex];
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
  catalog: TileCatalogEntry[] = FULL_TILE_CATALOG
): OrientedTileDefinition | null {
  const tile = findTile(tileId, catalog);
  if (!tile) {
    return null;
  }

  const edges = rotateEdges(tile.features.edges, orientation);
  const cities = tile.features.cities.map((feature) => ({
    edges: rotateItems(feature.edges, EDGE_ORDER, orientation),
    pennants: feature.pennants,
    ...(feature.cathedral ? { cathedral: feature.cathedral } : {})
  }));
  const roads = tile.features.roads.map((feature) => ({
    edges: rotateItems(feature.edges, EDGE_ORDER, orientation),
    ...(feature.inn ? { inn: feature.inn } : {})
  }));
  const farms = tile.features.farms.map((feature) => ({
    zones: rotateFarmZones(feature.zones, orientation)
  }));

  const cityByEdge: Partial<Record<Edge, number>> = {};
  const roadByEdge: Partial<Record<Edge, number>> = {};
  const farmByZone: Partial<Record<FarmZone, number>> = {};

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
    feature.zones.forEach((zone) => {
      farmByZone[zone] = index;
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
    garden: tile.features.garden ?? false,
    cityByEdge,
    roadByEdge,
    farmByZone
  };
}
