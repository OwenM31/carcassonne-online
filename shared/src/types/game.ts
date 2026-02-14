export type GameId = string;
export type PlayerId = string;
export type TileId = string;

export type Orientation = 0 | 90 | 180 | 270;
export type FeatureType = 'city' | 'road' | 'farm' | 'monastery';
export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';
export type GameEventType =
  | 'game_started'
  | 'draw_tile'
  | 'place_tile'
  | 'place_meeple'
  | 'skip_meeple'
  | 'score'
  | 'discard_tile'
  | 'game_over';

export interface Coordinate {
  x: number;
  y: number;
}

export interface BoardBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface PlacedTile {
  tileId: TileId;
  position: Coordinate;
  orientation: Orientation;
}

export interface BoardState {
  tiles: Record<string, PlacedTile>;
  bounds: BoardBounds;
}

export interface OpenClosedCount {
  total: number;
  open: number;
  closed: number;
}

export interface FeatureCounter {
  cities: OpenClosedCount;
  roads: OpenClosedCount;
  monasteries: number;
  grasslands: number;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  meeplesAvailable: number;
  score: number;
}

export interface PlayerSetup {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  meeplesAvailable?: number;
}

export type GameStatus = 'waiting' | 'active' | 'finished';
export type TurnPhase = 'setup' | 'draw_tile' | 'place_tile' | 'place_meeple' | 'scoring' | 'game_over';

export interface GameState {
  id: GameId;
  status: GameStatus;
  phase: TurnPhase;
  players: PlayerState[];
  activePlayerIndex: number;
  board: BoardState;
  tileDeck: TileId[];
  tileDiscard: TileId[];
  currentTileId: TileId | null;
  lastPlacedTile: PlacedTile | null;
  meeples: PlacedMeeple[];
  eventLog: GameEvent[];
  startingTileId: TileId;
  turnNumber: number;
  seed?: string;
}

export interface GameSetup {
  gameId: GameId;
  players: PlayerSetup[];
  tileDeck: TileId[];
  startingTileId: TileId;
  seed?: string;
}

export interface PlacementOption {
  position: Coordinate;
  orientation: Orientation;
}

export interface MeeplePlacement {
  tilePosition: Coordinate;
  featureType: FeatureType;
  featureIndex: number;
}

export interface PlacedMeeple extends MeeplePlacement {
  playerId: PlayerId;
}

export interface GameEvent {
  turn: number;
  type: GameEventType;
  playerId?: PlayerId;
  detail: string;
}

export interface DrawTileAction {
  type: 'draw_tile';
  playerId: PlayerId;
}

export interface PlaceTileAction {
  type: 'place_tile';
  playerId: PlayerId;
  tileId: TileId;
  position: Coordinate;
  orientation: Orientation;
}

export interface PlaceMeepleAction {
  type: 'place_meeple';
  playerId: PlayerId;
  placement: MeeplePlacement;
}

export interface SkipMeepleAction {
  type: 'skip_meeple';
  playerId: PlayerId;
}

export type GameAction = DrawTileAction | PlaceTileAction | PlaceMeepleAction | SkipMeepleAction;
