import type { SessionAddon, SessionMode, SessionTurnTimer } from './session';

export type GameId = string;
export type PlayerId = string;
export type TileId = string;

export type Orientation = 0 | 90 | 180 | 270;
export type FeatureType = 'city' | 'road' | 'farm' | 'monastery' | 'garden';
export type MeepleKind = 'normal' | 'big' | 'abbot';
export type PlayerColor = 'black' | 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'pink';
export type GameEventType =
  | 'game_started'
  | 'draw_tile'
  | 'place_tile'
  | 'place_meeple'
  | 'return_abbot'
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
  bigMeepleAvailable: boolean;
  abbotAvailable: boolean;
  score: number;
}

export interface PlayerSetup {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  meeplesAvailable?: number;
  bigMeepleAvailable?: boolean;
  abbotAvailable?: boolean;
}

export type GameStatus = 'waiting' | 'active' | 'finished';
export type TurnPhase = 'setup' | 'draw_tile' | 'place_tile' | 'place_meeple' | 'scoring' | 'game_over';

export interface GameState {
  id: GameId;
  mode: SessionMode;
  addons: SessionAddon[];
  status: GameStatus;
  phase: TurnPhase;
  players: PlayerState[];
  activePlayerIndex: number;
  board: BoardState;
  tileDeck: TileId[];
  tileDiscard: TileId[];
  currentTileId: TileId | null;
  currentTileOrientation: Orientation | null;
  lastPlacedTile: PlacedTile | null;
  meeples: PlacedMeeple[];
  eventLog: GameEvent[];
  startingTileId: TileId;
  turnTimerSeconds: SessionTurnTimer;
  turnStartedAt: string;
  turnNumber: number;
  seed?: string;
}

export interface GameSetup {
  gameId: GameId;
  mode?: SessionMode;
  addons?: SessionAddon[];
  players: PlayerSetup[];
  tileDeck: TileId[];
  startingTileId: TileId;
  turnTimerSeconds?: SessionTurnTimer;
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
  kind: MeepleKind;
}

export interface GameEvent {
  turn: number;
  type: GameEventType;
  playerId?: PlayerId;
  detail: string;
  createdAt?: string;
}

export interface DrawTileAction {
  type: 'draw_tile';
  playerId: PlayerId;
}

export interface DrawSandboxTileAction {
  type: 'draw_sandbox_tile';
  playerId: PlayerId;
  tileId: TileId;
}

export interface PlaceTileAction {
  type: 'place_tile';
  playerId: PlayerId;
  tileId: TileId;
  position: Coordinate;
  orientation: Orientation;
}

export interface SetTileOrientationAction {
  type: 'set_tile_orientation';
  playerId: PlayerId;
  orientation: Orientation;
}

export interface PlaceMeepleAction {
  type: 'place_meeple';
  playerId: PlayerId;
  placement: MeeplePlacement;
  kind?: MeepleKind;
}

export interface SkipMeepleAction {
  type: 'skip_meeple';
  playerId: PlayerId;
}

export interface ReturnAbbotAction {
  type: 'return_abbot';
  playerId: PlayerId;
}

export type GameAction =
  | DrawTileAction
  | DrawSandboxTileAction
  | SetTileOrientationAction
  | PlaceTileAction
  | PlaceMeepleAction
  | SkipMeepleAction
  | ReturnAbbotAction;
