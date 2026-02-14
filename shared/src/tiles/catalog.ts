import { TileId } from '../types/game';
import {
  CityFeature,
  Corner,
  Edge,
  EdgeType,
  FarmFeature,
  RoadFeature,
  TileFeatures
} from './types';

export interface TileSource {
  sheet: 'tiles.png';
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

const TILE_SHEET: TileSource['sheet'] = 'tiles.png';
const CITY: EdgeType = 'city';
const ROAD: EdgeType = 'road';
const FARM: EdgeType = 'farm';

const edges = (
  N: EdgeType,
  E: EdgeType,
  S: EdgeType,
  W: EdgeType
): Record<Edge, EdgeType> => ({
  N,
  E,
  S,
  W
});

const city = (edgeList: Edge[], pennants = 0): CityFeature => ({
  edges: edgeList,
  pennants
});

const road = (edgeList: Edge[]): RoadFeature => ({
  edges: edgeList
});

const farm = (cornerList: Corner[]): FarmFeature => ({
  corners: cornerList
});

export const TILE_CATALOG: TileCatalogEntry[] = [
  {
    id: 'T_R1C1',
    label: 'monastery',
    count: 4,
    source: { sheet: TILE_SHEET, row: 1, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, FARM, FARM),
      cities: [],
      roads: [],
      farms: [farm(['NW', 'NE', 'SE', 'SW'])],
      monastery: true
    }
  },
  {
    id: 'T_R1C2',
    label: 'monastery_road',
    count: 2,
    source: { sheet: TILE_SHEET, row: 1, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, ROAD, FARM),
      cities: [],
      roads: [road(['S'])],
      farms: [farm(['NW', 'SW']), farm(['NE', 'SE'])],
      monastery: true
    }
  },
  {
    id: 'T_R1C3',
    label: 'city_full_shield',
    count: 1,
    source: { sheet: TILE_SHEET, row: 1, col: 3 },
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
    source: { sheet: TILE_SHEET, row: 1, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, CITY),
      cities: [city(['N', 'E', 'W'])],
      roads: [],
      farms: [farm(['SW', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R1C5',
    label: 'city_cap_shield',
    count: 1,
    source: { sheet: TILE_SHEET, row: 1, col: 5 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, CITY),
      cities: [city(['N', 'E', 'W'], 1)],
      roads: [],
      farms: [farm(['SW', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R1C6',
    label: 'city_r1c6',
    count: 1,
    source: { sheet: TILE_SHEET, row: 1, col: 6 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, ROAD, CITY),
      cities: [city(['N', 'E', 'W'])],
      roads: [road(['S'])],
      farms: [farm(['SW']), farm(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R1C7',
    label: 'city_r1c7',
    count: 2,
    source: { sheet: TILE_SHEET, row: 1, col: 7 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, ROAD, CITY),
      cities: [city(['N', 'E', 'W'], 1)],
      roads: [road(['S'])],
      farms: [farm(['SW']), farm(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R1C8',
    label: 'city_r1c8',
    count: 3,
    source: { sheet: TILE_SHEET, row: 1, col: 8 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, CITY),
      cities: [city(['N', 'W'])],
      roads: [],
      farms: [farm(['NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C1',
    label: 'city_r2c1',
    count: 2,
    source: { sheet: TILE_SHEET, row: 2, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, CITY),
      cities: [city(['N', 'W'], 1)],
      roads: [],
      farms: [farm(['NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C2',
    label: 'city_r2c2',
    count: 3,
    source: { sheet: TILE_SHEET, row: 2, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, CITY),
      cities: [city(['N', 'W'])],
      roads: [road(['E', 'S'])],
      farms: [farm(['NE', 'SW']), farm(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C3',
    label: 'city_r2c3',
    count: 2,
    source: { sheet: TILE_SHEET, row: 2, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, CITY),
      cities: [city(['N', 'W'], 1)],
      roads: [road(['E', 'S'])],
      farms: [farm(['NE', 'SW']), farm(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C4',
    label: 'city_r2c4',
    count: 1,
    source: { sheet: TILE_SHEET, row: 2, col: 4 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, CITY, FARM, CITY),
      cities: [city(['N', 'E', 'W'])],
      roads: [],
      farms: [farm(['SW', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C5',
    label: 'city_r2c5',
    count: 2,
    source: { sheet: TILE_SHEET, row: 2, col: 5 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, CITY, FARM),
      cities: [city(['N']), city(['S'], 1)],
      roads: [],
      farms: [farm(['NW', 'NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C6',
    label: 'city_r2c6',
    count: 2,
    source: { sheet: TILE_SHEET, row: 2, col: 6 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, CITY),
      cities: [city(['N']), city(['W'])],
      roads: [],
      farms: [farm(['NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C7',
    label: 'city_r2c7',
    count: 3,
    source: { sheet: TILE_SHEET, row: 2, col: 7 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, CITY, FARM),
      cities: [city(['N']), city(['S'])],
      roads: [],
      farms: [farm(['NW', 'NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R2C8',
    label: 'city_cap',
    count: 5,
    source: { sheet: TILE_SHEET, row: 2, col: 8 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, FARM, FARM),
      cities: [city(['N'])],
      roads: [],
      farms: [farm(['NW', 'NE', 'SE', 'SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C1',
    label: 'city_road_r3c1',
    count: 3,
    source: { sheet: TILE_SHEET, row: 3, col: 1 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, FARM, ROAD, ROAD),
      cities: [city(['N'])],
      roads: [road(['W', 'S'])],
      farms: [farm(['NW', 'NE', 'SE']), farm(['SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C2',
    label: 'city_road_r3c2',
    count: 3,
    source: { sheet: TILE_SHEET, row: 3, col: 2 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, FARM),
      cities: [city(['N'])],
      roads: [road(['E', 'S'])],
      farms: [farm(['NW', 'NE', 'SW']), farm(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C3',
    label: 'city_road_r3c3',
    count: 3,
    source: { sheet: TILE_SHEET, row: 3, col: 3 },
    startingTileCandidate: false,
    features: {
      edges: edges(CITY, ROAD, ROAD, ROAD),
      cities: [city(['N'])],
      roads: [road(['W', 'E', 'S'])],
      farms: [farm(['NW', 'NE']), farm(['SW']), farm(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C4',
    label: 'city_road_straight',
    count: 4,
    source: { sheet: TILE_SHEET, row: 3, col: 4 },
    startingTileCandidate: true,
    features: {
      edges: edges(CITY, ROAD, FARM, ROAD),
      cities: [city(['N'])],
      roads: [road(['W', 'E'])],
      farms: [farm(['NW', 'NE']), farm(['SW', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C5',
    label: 'road_straight',
    count: 8,
    source: { sheet: TILE_SHEET, row: 3, col: 5 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, FARM, ROAD, FARM),
      cities: [],
      roads: [road(['N', 'S'])],
      farms: [farm(['NW', 'SW']), farm(['NE', 'SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C6',
    label: 'road_corner',
    count: 9,
    source: { sheet: TILE_SHEET, row: 3, col: 6 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, FARM, ROAD, ROAD),
      cities: [],
      roads: [road(['W', 'S'])],
      farms: [farm(['NW', 'NE', 'SE']), farm(['SW'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C7',
    label: 'road_t',
    count: 4,
    source: { sheet: TILE_SHEET, row: 3, col: 7 },
    startingTileCandidate: false,
    features: {
      edges: edges(FARM, ROAD, ROAD, ROAD),
      cities: [],
      roads: [road(['W']), road(['E']), road(['S'])],
      farms: [farm(['NW', 'NE']), farm(['SW']), farm(['SE'])],
      monastery: false
    }
  },
  {
    id: 'T_R3C8',
    label: 'road_cross',
    count: 1,
    source: { sheet: TILE_SHEET, row: 3, col: 8 },
    startingTileCandidate: false,
    features: {
      edges: edges(ROAD, ROAD, ROAD, ROAD),
      cities: [],
      roads: [road(['N']), road(['E']), road(['S']), road(['W'])],
      farms: [farm(['NW']), farm(['NE']), farm(['SE']), farm(['SW'])],
      monastery: false
    }
  }
];
