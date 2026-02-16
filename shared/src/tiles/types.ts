export type Edge = 'N' | 'E' | 'S' | 'W';
export type Corner = 'NW' | 'NE' | 'SE' | 'SW';
export type FarmZone =
  | 'NNW'
  | 'NNE'
  | 'ENE'
  | 'ESE'
  | 'SSE'
  | 'SSW'
  | 'WSW'
  | 'WNW'
  | 'CENTER';
export type EdgeType = 'city' | 'road' | 'farm' | 'river';

export interface CityFeature {
  edges: Edge[];
  pennants: number;
  cathedral?: boolean;
}

export interface RoadFeature {
  edges: Edge[];
  inn?: boolean;
}

export interface FarmFeature {
  zones: FarmZone[];
}

export interface TileFeatures {
  edges: Record<Edge, EdgeType>;
  cities: CityFeature[];
  roads: RoadFeature[];
  farms: FarmFeature[];
  monastery: boolean;
  garden?: boolean;
}
