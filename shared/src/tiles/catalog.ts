/**
 * @description Tile catalog definitions for base and add-on tile sets.
 */
import type { SessionAddon } from '../types/session';
import type { TileId } from '../types/game';
import type {
  CityFeature,
  Corner,
  Edge,
  EdgeType,
  FarmFeature,
  FarmZone,
  RoadFeature,
  TileFeatures
} from './types';

export type TileSheet =
  | 'tiles.png'
  | 'tiles-inns-and-cathedrals.png'
  | 'tiles-river.png'
  | 'tiles-river-2.png'
  | 'tiles-abbot.png'
  | 'tiles-abbot-river.png'
  | 'tiles-abbot-river-2.png'
  | 'tiles-abbot-inns-and-cathedrals.png';

export interface TileSource {
  sheet: TileSheet;
  row: number;
  col: number;
}

export interface TileCatalogEntry {
  id: TileId;
  label: string;
  count: number;
  source: TileSource;
  startingTileCandidate: boolean;
  features: TileFeatures;
}

const BASE_TILE_SHEET: TileSheet = 'tiles.png';
const INNS_TILE_SHEET: TileSheet = 'tiles-inns-and-cathedrals.png';
const RIVER_TILE_SHEET: TileSheet = 'tiles-river.png';
const RIVER_2_TILE_SHEET: TileSheet = 'tiles-river-2.png';
const ABBOT_TILE_SHEET: TileSheet = 'tiles-abbot.png';
const ABBOT_RIVER_TILE_SHEET: TileSheet = 'tiles-abbot-river.png';
const ABBOT_RIVER_2_TILE_SHEET: TileSheet = 'tiles-abbot-river-2.png';
const ABBOT_INNS_TILE_SHEET: TileSheet = 'tiles-abbot-inns-and-cathedrals.png';
const CITY: EdgeType = 'city';
const ROAD: EdgeType = 'road';
const FARM: EdgeType = 'farm';
const RIVER: EdgeType = 'river';

const CORNER_TO_ZONES: Record<Corner, FarmZone[]> = {
  NW: ['NNW', 'WNW'],
  NE: ['NNE', 'ENE'],
  SE: ['ESE', 'SSE'],
  SW: ['SSW', 'WSW']
};

const edges = (
  N: EdgeType,
  E: EdgeType,
  S: EdgeType,
  W: EdgeType
): Record<Edge, EdgeType> => ({ N, E, S, W });

const city = (edgeList: Edge[], pennants = 0, cathedral = false): CityFeature => ({
  edges: edgeList,
  pennants,
  ...(cathedral ? { cathedral } : {})
});

const road = (edgeList: Edge[], inn = false): RoadFeature => ({
  edges: edgeList,
  ...(inn ? { inn } : {})
});

const farmCorners = (cornerList: Corner[]): FarmFeature => ({
  zones: cornerList.flatMap((corner) => CORNER_TO_ZONES[corner])
});

const farmZones = (zones: FarmZone[]): FarmFeature => ({ zones });

export const BASE_TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'T_R1C1',
    label: 'monastery',
    count: 4,
    source: { sheet: BASE_TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, FARM, FARM),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SE', 'SW'])],
      monastery: true
    }
  },
  {
    id: 'T_R1C2',
    label: 'monastery_road',
    count: 2,
    source: { sheet: BASE_TILE_SHEET, row: 1, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, ROAD, FARM),
      cities: [],
      roads: [road(['S'])],
      farms: [farmCorners(['NW', 'SW','NE', 'SE'])],
      monastery: true
    }
  },
  {
    id: 'T_R1C3',
    label: 'city_full_shield',
    count: 1,
    source: { sheet: BASE_TILE_SHEET, row: 1, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, CITY, CITY),
      cities: [city(['N', 'E', 'S', 'W'], 1)],
      roads: [],
      farms: [],
      monastery: false
    }
  },
  {
    id: 'T_R1C4',
    label: 'city_full',
    count: 3,
    source: { sheet: BASE_TILE_SHEET, row: 1, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, CITY),
      cities: [city(['N', 'E', 'W'])],
      roads: [],
      farms: [farmCorners(['SW', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R1C5',
    label: 'city_cap_shield',
    count: 1,
    source: { sheet: BASE_TILE_SHEET, row: 1, col: 5 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, CITY),
      cities: [city(['N', 'E', 'W'], 1)],
      roads: [],
      farms: [farmCorners(['SW', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R1C6',
    label: 'city_r1c6',
    count: 1,
    source: { sheet: BASE_TILE_SHEET, row: 1, col: 6 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, ROAD, CITY),
      cities: [city(['N', 'E', 'W'])],
      roads: [road(['S'])],
      farms: [farmCorners(['SW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R1C7',
    label: 'city_r1c7',
    count: 2,
    source: { sheet: BASE_TILE_SHEET, row: 1, col: 7 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, ROAD, CITY),
      cities: [city(['N', 'E', 'W'], 1)],
      roads: [road(['S'])],
      farms: [farmZones(['SSW']), farmZones(['SSE'])],
      monastery: false
    }
  },
  {
    id: 'T_R1C8',
    label: 'city_r1c8',
    count: 3,
    source: { sheet: BASE_TILE_SHEET, row: 1, col: 8 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, CITY),
      cities: [city(['N', 'W'])],
      roads: [],
      farms: [farmCorners(['NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C1',
    label: 'city_r2c1',
    count: 2,
    source: { sheet: BASE_TILE_SHEET, row: 2, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, CITY),
      cities: [city(['N', 'W'], 1)],
      roads: [],
      farms: [farmCorners(['NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C2',
    label: 'city_r2c2',
    count: 3,
    source: { sheet: BASE_TILE_SHEET, row: 2, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, CITY),
      cities: [city(['N', 'W'])],
      roads: [road(['E', 'S'])],
      farms: [farmCorners(['NE', 'SW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C3',
    label: 'city_r2c3',
    count: 2,
    source: { sheet: BASE_TILE_SHEET, row: 2, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, CITY),
      cities: [city(['N', 'W'], 1)],
      roads: [road(['E', 'S'])],
      farms: [farmCorners(['NE', 'SW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C4',
    label: 'city_r2c4',
    count: 1,
    source: { sheet: BASE_TILE_SHEET, row: 2, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, CITY, FARM, CITY),
      cities: [city(['E', 'W'])],
      roads: [],
      farms: [farmCorners(['NW', 'NE']), farmCorners(['SW', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C5',
    label: 'city_r2c5',
    count: 2,
    source: { sheet: BASE_TILE_SHEET, row: 2, col: 5 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, CITY, FARM, CITY),
      cities: [city(['E','W'], 1)],
      roads: [],
      farms: [farmCorners(['NW', 'NE']), farmCorners(['SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C6',
    label: 'city_r2c6',
    count: 2,
    source: { sheet: BASE_TILE_SHEET, row: 2, col: 6 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, CITY),
      cities: [city(['N']), city(['W'])],
      roads: [],
      farms: [farmCorners(['NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C7',
    label: 'city_r2c7',
    count: 3,
    source: { sheet: BASE_TILE_SHEET, row: 2, col: 7 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, CITY, FARM),
      cities: [city(['N']), city(['S'])],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C8',
    label: 'city_cap',
    count: 5,
    source: { sheet: BASE_TILE_SHEET, row: 2, col: 8 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, FARM),
      cities: [city(['N'])],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C1',
    label: 'city_road_r3c1',
    count: 3,
    source: { sheet: BASE_TILE_SHEET, row: 3, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, ROAD, ROAD),
      cities: [city(['N'])],
      roads: [road(['W', 'S'])],
      farms: [farmCorners(['NW', 'NE', 'SE']), farmCorners(['SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C2',
    label: 'city_road_r3c2',
    count: 3,
    source: { sheet: BASE_TILE_SHEET, row: 3, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, FARM),
      cities: [city(['N'])],
      roads: [road(['E', 'S'])],
      farms: [farmZones(['WNW', 'ENE', 'WSW', 'SSW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C3',
    label: 'city_road_r3c3',
    count: 3,
    source: { sheet: BASE_TILE_SHEET, row: 3, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, ROAD),
      cities: [city(['N'])],
      roads: [road(['W']), road(['E']), road(['S'])],
      farms: [farmCorners(['NW', 'NE']), farmCorners(['SW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C4',
    label: 'city_road_straight',
    count: 4,
    source: { sheet: BASE_TILE_SHEET, row: 3, col: 4 },
    startingTileCandidate: true,
    features: {
      edges: edges(CITY, ROAD, FARM, ROAD),
      cities: [city(['N'])],
      roads: [road(['W', 'E'])],
      farms: [farmCorners(['NW', 'NE']), farmCorners(['SW', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C5',
    label: 'road_straight',
    count: 8,
    source: { sheet: BASE_TILE_SHEET, row: 3, col: 5 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, FARM, ROAD, FARM),
      cities: [],
      roads: [road(['N', 'S'])],
      farms: [farmCorners(['NW', 'SW']), farmCorners(['NE', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C6',
    label: 'road_corner',
    count: 9,
    source: { sheet: BASE_TILE_SHEET, row: 3, col: 6 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, ROAD, ROAD),
      cities: [],
      roads: [road(['W', 'S'])],
      farms: [farmCorners(['NW', 'NE', 'SE']), farmCorners(['SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C7',
    label: 'road_t',
    count: 4,
    source: { sheet: BASE_TILE_SHEET, row: 3, col: 7 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, ROAD, ROAD, ROAD),
      cities: [],
      roads: [road(['W']), road(['E']), road(['S'])],
      farms: [farmCorners(['NW', 'NE']), farmCorners(['SW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C8',
    label: 'road_cross',
    count: 1,
    source: { sheet: BASE_TILE_SHEET, row: 3, col: 8 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, ROAD, ROAD, ROAD),
      cities: [],
      roads: [road(['N']), road(['E']), road(['S']), road(['W'])],
      farms: [farmCorners(['NW']), farmCorners(['NE']), farmCorners(['SE']), farmCorners(['SW'])],
      monastery: false
    }
  }
];

export const INNS_AND_CATHEDRALS_TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'IC_R1C1',
    label: 'monastery_with_two_roads',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, ROAD, FARM, ROAD),
      cities: [],
      roads: [road(['E']), road(['W'])],
      farms: [farmCorners(['NE', 'NW']), farmCorners(['SE', 'SW'])],
      monastery: true
    }
  },
  {
    id: 'IC_R1C2',
    label: 'city_with_cathedral',
    count: 2,
    source: { sheet: INNS_TILE_SHEET, row: 1, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, CITY, CITY),
      cities: [city(['N', 'E', 'S', 'W'], 0, true)],
      roads: [],
      farms: [],
      monastery: false
    }
  },
  {
    id: 'IC_R1C3',
    label: 'four_cities',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 1, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, CITY, CITY),
      cities: [city(['N']), city(['E']), city(['S']), city(['W'])],
      roads: [],
      farms: [farmZones(['CENTER'])],
      monastery: false
    }
  },
  {
    id: 'IC_R1C4',
    label: 'three_cities',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 1, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, CITY),
      cities: [city(['N']), city(['E']), city(['W'])],
      roads: [],
      farms: [farmCorners(['SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R1C5',
    label: 'two_cities_four_fields',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 1, col: 5 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, CITY, ROAD),
      cities: [city(['N']), city(['S'])],
      roads: [road(['E', 'W'])],
      farms: [farmCorners(['NE']), farmCorners(['SE']), farmCorners(['NW']), farmCorners(['SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R1C6',
    label: 'banner_corner_field',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 1, col: 6 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, CITY, CITY),
      cities: [city(['N', 'W'], 1), city(['S'])],
      roads: [],
      farms: [farmCorners(['NE', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'IC_R1C7',
    label: 'corner_city',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 1, col: 7 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, FARM),
      cities: [city(['N'])],
      roads: [],
      farms: [farmCorners(['NE']), farmCorners(['NW', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R1C8',
    label: 'city_with_road',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 1, col: 8 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, ROAD, FARM),
      cities: [city(['N'])],
      roads: [road(['S'])],
      farms: [farmCorners(['NE', 'SE']), farmCorners(['NW', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R2C1',
    label: 'corner_city_with_road',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 2, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, FARM, CITY),
      cities: [city(['W', 'N'])],
      roads: [road(['E'])],
      farms: [farmCorners(['NE']), farmCorners(['SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R2C2',
    label: 'thru_city_with_roads',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 2, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, CITY, ROAD, CITY),
      cities: [city(['E', 'W'], 1)],
      roads: [road(['N']), road(['S'])],
      farms: [farmCorners(['NE']), farmCorners(['SE']), farmCorners(['NW']), farmCorners(['SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R2C3',
    label: 'corner_city_with_inn_road',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 2, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, ROAD, CITY),
      cities: [city(['N', 'W'])],
      roads: [road(['S'], true)],
      farms: [farmZones(['SSW']), farmCorners(['SE', 'NE'])],
      monastery: false
    }
  },
  {
    id: 'IC_R2C4',
    label: 'city_with_inn_road_corner',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 2, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, ROAD, ROAD),
      cities: [city(['N'])],
      roads: [road(['W', 'S'], true)],
      farms: [farmCorners(['SE']), farmCorners(['SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R2C5',
    label: 'shield_corner_city_with_inn_road_corner',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 2, col: 5 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, CITY),
      cities: [city(['N', 'W'], 1)],
      roads: [road(['S', 'E'], true)],
      farms: [farmCorners(['NE']), farmCorners(['SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R2C6',
    label: 'triple_road_with_double_inn',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 2, col: 6 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, ROAD, ROAD, ROAD),
      cities: [],
      roads: [road(['W'], true), road(['E'], true), road(['S'])],
      farms: [farmCorners(['NW']), farmCorners(['NE']), farmCorners(['SW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'IC_R2C7',
    label: 'inn_road_straight',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 2, col: 7 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, ROAD, FARM, ROAD),
      cities: [],
      roads: [road(['W', 'E'], true)],
      farms: [farmCorners(['NW', 'SW']), farmCorners(['NE', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'IC_R2C8',
    label: 'inn_road_corner',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 2, col: 8 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, ROAD, ROAD),
      cities: [],
      roads: [road(['W', 'S'], true)],
      farms: [farmCorners(['NW', 'NE', 'SE']), farmCorners(['SW'])],
      monastery: false
    }
  },
  {
    id: 'IC_R3C1',
    label: 'double_corner_roads',
    count: 1,
    source: { sheet: INNS_TILE_SHEET, row: 3, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, ROAD, ROAD, ROAD),
      cities: [],
      roads: [road(['N', 'E']), road(['S', 'W'])],
      farms: [farmCorners(['NW']), farmCorners(['NE']), farmCorners(['SE']), farmCorners(['SW'])],
      monastery: false
    }
  }
];

export const ABBOT_TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'AB_R1C1',
    label: 'garden_city_cap',
    count: 1,
    source: { sheet: ABBOT_TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, FARM),
      cities: [city(['N'])],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SE', 'SW'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'AB_R1C2',
    label: 'garden_two_city_caps',
    count: 1,
    source: { sheet: ABBOT_TILE_SHEET, row: 1, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, CITY, FARM),
      cities: [city(['N']), city(['S'])],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SE', 'SW'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'AB_R1C3',
    label: 'garden_city_corner',
    count: 1,
    source: { sheet: ABBOT_TILE_SHEET, row: 1, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, CITY),
      cities: [city(['N']), city(['W'])],
      roads: [],
      farms: [farmCorners(['NE', 'SE', 'SW'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'AB_R1C4',
    label: 'garden_city_corner_shield',
    count: 1,
    source: { sheet: ABBOT_TILE_SHEET, row: 1, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, FARM),
      cities: [city(['N', 'E'], 1)],
      roads: [],
      farms: [farmCorners(['NW', 'SW', 'SE'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'AB_R2C1',
    label: 'garden_city_corner_east',
    count: 1,
    source: { sheet: ABBOT_TILE_SHEET, row: 2, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, FARM),
      cities: [city(['N', 'E'])],
      roads: [],
      farms: [farmCorners(['NW', 'SW', 'SE'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'AB_R2C2',
    label: 'garden_three_city',
    count: 1,
    source: { sheet: ABBOT_TILE_SHEET, row: 2, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, CITY),
      cities: [city(['N', 'E', 'W'])],
      roads: [],
      farms: [farmCorners(['SE', 'SW'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'AB_R2C3',
    label: 'garden_road_straight',
    count: 1,
    source: { sheet: ABBOT_TILE_SHEET, row: 2, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, FARM, ROAD, FARM),
      cities: [],
      roads: [road(['N', 'S'])],
      farms: [farmCorners(['NW', 'SW']), farmCorners(['NE', 'SE'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'AB_R2C4',
    label: 'garden_road_corner',
    count: 1,
    source: { sheet: ABBOT_TILE_SHEET, row: 2, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, ROAD, ROAD),
      cities: [],
      roads: [road(['W', 'S'])],
      farms: [farmCorners(['NW', 'NE', 'SE']), farmCorners(['SW'])],
      monastery: false,
      garden: true
    }
  }
];

export const ABBOT_AND_RIVER_TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'ABRV1_R1C1',
    label: 'garden_river_curve',
    count: 1,
    source: { sheet: ABBOT_RIVER_TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, RIVER, RIVER, FARM),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SW']), farmCorners(['SE'])],
      monastery: false,
      garden: true
    }
  }
];

export const ABBOT_AND_RIVER_2_TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'ABRV2_R1C1',
    label: 'garden_river_curve',
    count: 1,
    source: { sheet: ABBOT_RIVER_2_TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, RIVER, RIVER, FARM),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SW']), farmCorners(['SE'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'ABRV2_R1C2',
    label: 'garden_bridge_road',
    count: 1,
    source: { sheet: ABBOT_RIVER_2_TILE_SHEET, row: 1, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, RIVER, ROAD, RIVER),
      cities: [],
      roads: [road(['N', 'S'])],
      farms: [farmCorners(['NW']), farmCorners(['NE']), farmCorners(['SE']), farmCorners(['SW'])],
      monastery: false,
      garden: true
    }
  }
];

export const ABBOT_AND_INNS_AND_CATHEDRALS_TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'ABIC_R1C1',
    label: 'garden_inn_road_straight',
    count: 1,
    source: { sheet: ABBOT_INNS_TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, ROAD, FARM, ROAD),
      cities: [],
      roads: [road(['E', 'W'], true)],
      farms: [farmCorners(['NW', 'NE']), farmCorners(['SE', 'SW'])],
      monastery: false,
      garden: true
    }
  },
  {
    id: 'ABIC_R1C2',
    label: 'garden_four_cities',
    count: 1,
    source: { sheet: ABBOT_INNS_TILE_SHEET, row: 1, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, CITY, CITY),
      cities: [city(['N']), city(['E']), city(['S']), city(['W'])],
      roads: [],
      farms: [farmZones(['CENTER'])],
      monastery: false,
      garden: true
    }
  }
];

export const RIVER_START_TILE_ID: TileId = 'RV1_R1C1';
export const RIVER_END_TILE_ID: TileId = 'RV1_R3C2';

export const RIVER_TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'RV1_R1C1',
    label: 'river_source',
    count: 1,
    source: { sheet: RIVER_TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, RIVER, FARM, FARM),
      cities: [],
      roads: [],
      farms: [
        farmZones(['NNW', 'WNW', 'WSW', 'SSW']),
        farmZones(['NNE', 'ENE', 'ESE', 'SSE'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV1_R1C2',
    label: 'river_straight',
    count: 2,
    source: { sheet: RIVER_TILE_SHEET, row: 1, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, RIVER, FARM, RIVER),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'NE']), farmCorners(['SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'RV1_R1C3',
    label: 'river_curve',
    count: 2,
    source: { sheet: RIVER_TILE_SHEET, row: 1, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, RIVER, RIVER),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SE']), farmCorners(['SW'])],
      monastery: false
    }
  },
  {
    id: 'RV1_R1C4',
    label: 'river_curve_road',
    count: 1,
    source: { sheet: RIVER_TILE_SHEET, row: 1, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, ROAD, RIVER, RIVER),
      cities: [],
      roads: [road(['N', 'E'])],
      farms: [farmCorners(['NW', 'SE']), farmCorners(['NE']), farmCorners(['SW'])],
      monastery: false
    }
  },
  {
    id: 'RV1_R2C1',
    label: 'river_curve_city',
    count: 1,
    source: { sheet: RIVER_TILE_SHEET, row: 2, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, RIVER, RIVER, CITY),
      cities: [city(['N', 'W'])],
      roads: [],
      farms: [farmZones(['ENE','SSW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'RV1_R2C2',
    label: 'river_monastery_road',
    count: 1,
    source: { sheet: RIVER_TILE_SHEET, row: 2, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, RIVER, ROAD, RIVER),
      cities: [],
      roads: [road(['S'])],
      farms: [
        farmCorners(['NW', 'NE']),
        farmZones(['WSW', 'SSW']),
        farmZones(['ESE', 'SSE'])
      ],
      monastery: true
    }
  },
  {
    id: 'RV1_R2C3',
    label: 'river_city_road',
    count: 1,
    source: { sheet: RIVER_TILE_SHEET, row: 2, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, RIVER, ROAD, RIVER),
      cities: [city(['N'])],
      roads: [road(['S'])],
      farms: [
        farmZones(['WNW']),
        farmZones(['ENE']),
        farmZones(['WSW', 'SSW']),
        farmZones(['ESE', 'SSE'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV1_R2C4',
    label: 'river_cities_straight',
    count: 1,
    source: { sheet: RIVER_TILE_SHEET, row: 2, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, RIVER, CITY, RIVER),
      cities: [city(['N']), city(['S'])],
      roads: [],
      farms: [
        farmZones(['WNW', 'ENE']),
        farmZones(['ESE', 'WSW'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV1_R3C1',
    label: 'river_bridge_road',
    count: 1,
    source: { sheet: RIVER_TILE_SHEET, row: 3, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, RIVER, ROAD, RIVER),
      cities: [],
      roads: [road(['N', 'S'])],
      farms: [
        farmCorners(['NW']),
        farmCorners(['NE']),
        farmCorners(['SE']),
        farmCorners(['SW'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV1_R3C2',
    label: 'river_lake',
    count: 1,
    source: { sheet: RIVER_TILE_SHEET, row: 3, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, FARM, RIVER),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'SW']), farmCorners(['NE', 'SE'])],
      monastery: false
    }
  }
];

export const RIVER_2_START_TILE_ID: TileId = 'RV2_R1C1';
export const RIVER_2_SECOND_TILE_ID: TileId = 'RV2_R1C2';
export const RIVER_2_END_TILE_IDS: TileId[] = ['RV2_R3C3', 'RV2_R3C4'];

export const RIVER_2_TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'RV2_R1C1',
    label: 'river_source',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, RIVER, FARM),
      cities: [],
      roads: [],
      farms: [
        farmZones(['NNW', 'WNW', 'WSW', 'SSW']),
        farmZones(['NNE', 'ENE', 'ESE', 'SSE'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV2_R1C2',
    label: 'river_fork',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 1, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(RIVER, RIVER, FARM, RIVER),
      cities: [city([])],
      roads: [],
      farms: [
        farmCorners(['NW']),
        farmCorners(['NE']),
        farmCorners(['SE', 'SW'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV2_R1C3',
    label: 'river_curve',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 1, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, RIVER, RIVER, FARM),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'SW', 'NE']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'RV2_R1C4',
    label: 'river_curve_with_road',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 1, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, RIVER, RIVER, ROAD),
      cities: [city([])],
      roads: [road(['N', 'W'])],
      farms: [farmCorners(['NE', 'SW']), farmCorners(['NW']), farmCorners(['SE'])],
      monastery: false
    }
  },
  {
    id: 'RV2_R2C1',
    label: 'river_curve_pasture',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 2, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(RIVER, FARM, FARM, RIVER),
      cities: [],
      roads: [],
      farms: [farmCorners(['NE', 'SE', 'SW']), farmCorners(['NW'])],
      monastery: false
    }
  },
  {
    id: 'RV2_R2C2',
    label: 'river_curve_city_shield',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 2, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, RIVER, RIVER, CITY),
      cities: [city(['N', 'W'], 1)],
      roads: [],
      farms: [farmZones(['ENE', 'SSW']), farmZones(['ESE', 'SSE'])],
      monastery: false
    }
  },
  {
    id: 'RV2_R2C3',
    label: 'river_bridge_city',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 2, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, RIVER, CITY, RIVER),
      cities: [city(['N', 'S'])],
      roads: [],
      farms: [
        farmZones(['WNW', 'ENE']), farmZones(['WSW', 'ESE'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV2_R2C4',
    label: 'river_bridge_city_road',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 2, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, RIVER, CITY, RIVER),
      cities: [city(['S'])],
      roads: [road(['N'])],
      farms: [
        farmZones(['WSW']),
        farmZones(['ESE']),
        farmCorners(['NW']),
        farmCorners(['NE'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV2_R3C1',
    label: 'river_curve_monastery',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 3, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, RIVER, FARM, RIVER),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'NE']), farmCorners(['SE', 'SW'])],
      monastery: true
    }
  },
  {
    id: 'RV2_R3C2',
    label: 'river_bridge_inn_road',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 3, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(RIVER, ROAD, RIVER, ROAD),
      cities: [],
      roads: [road(['W', 'E'], true)],
      farms: [
        farmCorners(['NW']),
        farmCorners(['NE']),
        farmCorners(['SE']),
        farmCorners(['SW'])
      ],
      monastery: false
    }
  },
  {
    id: 'RV2_R3C3',
    label: 'river_end_city',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 3, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(RIVER, FARM, CITY, FARM),
      cities: [city(['S'])],
      roads: [],
      farms: [farmCorners(['NW', 'SW']), farmCorners(['NE', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'RV2_R3C4',
    label: 'river_end_volcano',
    count: 1,
    source: { sheet: RIVER_2_TILE_SHEET, row: 3, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(RIVER, FARM, FARM, FARM),
      cities: [],
      roads: [],
      farms: [farmCorners(['NW', 'NE', 'SE', 'SW'])],
      monastery: false
    }
  }
];

export const RIVER_2_TILE_IDS: TileId[] = RIVER_2_TILE_CATALOG.map((tile) => tile.id);
export const RIVER_TILE_IDS: TileId[] = RIVER_TILE_CATALOG.map((tile) => tile.id);
const RIVER_TILE_ID_SET = new Set<TileId>(RIVER_TILE_IDS);
const RIVER_2_TILE_ID_SET = new Set<TileId>(RIVER_2_TILE_IDS);

export const isRiverTileId = (tileId: TileId): boolean => RIVER_TILE_ID_SET.has(tileId);
export const isRiver2TileId = (tileId: TileId): boolean => RIVER_2_TILE_ID_SET.has(tileId);

export const TILE_CATALOG: TileCatalogEntry[] = BASE_TILE_CATALOG;

export function buildCatalogForAddons(addons: SessionAddon[] = []): TileCatalogEntry[] {
  const catalog = [...BASE_TILE_CATALOG];
  const includeRiver = addons.includes('river');
  const includeRiver2 = addons.includes('river_2');
  const combinedRiverMode = includeRiver && includeRiver2;
  if (addons.includes('inns_and_cathedrals')) {
    catalog.push(...INNS_AND_CATHEDRALS_TILE_CATALOG);
  }
  if (includeRiver) {
    const riverTiles = combinedRiverMode
      ? RIVER_TILE_CATALOG.filter(
          (tile) => tile.id !== RIVER_START_TILE_ID && tile.id !== RIVER_END_TILE_ID
        )
      : RIVER_TILE_CATALOG;
    catalog.push(...riverTiles);
  }
  if (addons.includes('abbot')) {
    catalog.push(...ABBOT_TILE_CATALOG);
  }
  if (includeRiver2) {
    catalog.push(...RIVER_2_TILE_CATALOG);
  }
  if (addons.includes('abbot') && addons.includes('river')) {
    catalog.push(...ABBOT_AND_RIVER_TILE_CATALOG);
  }
  if (addons.includes('abbot') && addons.includes('river_2')) {
    catalog.push(...ABBOT_AND_RIVER_2_TILE_CATALOG);
  }
  if (addons.includes('abbot') && addons.includes('inns_and_cathedrals')) {
    catalog.push(...ABBOT_AND_INNS_AND_CATHEDRALS_TILE_CATALOG);
  }
  return catalog;
}

export const FULL_TILE_CATALOG: TileCatalogEntry[] = [
  ...BASE_TILE_CATALOG,
  ...INNS_AND_CATHEDRALS_TILE_CATALOG,
  ...RIVER_TILE_CATALOG,
  ...RIVER_2_TILE_CATALOG,
  ...ABBOT_TILE_CATALOG,
  ...ABBOT_AND_RIVER_TILE_CATALOG,
  ...ABBOT_AND_RIVER_2_TILE_CATALOG,
  ...ABBOT_AND_INNS_AND_CATHEDRALS_TILE_CATALOG
];
