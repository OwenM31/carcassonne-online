export type Edge = 'N' | 'E' | 'S' | 'W';
export type Corner = 'NW' | 'NE' | 'SE' | 'SW';
export type EdgeType = 'city' | 'road' | 'farm';

export interface CityFeature {
  edges: Edge[];
  pennants: number;
}

export interface RoadFeature {
  edges: Edge[];
}

export interface FarmFeature {
  corners: Corner[];
}

export interface TileFeatures {
  edges: Record<Edge, EdgeType>;
  cities: CityFeature[];
  roads: RoadFeature[];
  farms: FarmFeature[];
  monastery: boolean;
}
