/**
 * @description Shared helpers and constants used across game action handlers.
 */
import type { GameEvent, GameState } from '../types/game';
import type { ScoringResolution } from './scoring';

const EVENT_LOG_LIMIT = 24;

export const ERROR_NOT_ACTIVE = 'Only the active player can act.';
export const ERROR_GAME_INACTIVE = 'Game is not active.';
export const ERROR_DRAW_PHASE = 'Cannot draw a tile right now.';
export const ERROR_PLACE_PHASE = 'Cannot place a tile right now.';
export const ERROR_ORIENTATION_PHASE = 'Cannot change tile orientation right now.';
export const ERROR_MEEPLE_PHASE = 'Cannot place a meeple right now.';
export const ERROR_NO_TILE = 'No tile has been drawn.';
export const ERROR_TILE_MISMATCH = 'Tile does not match the current draw.';
export const ERROR_ILLEGAL_PLACEMENT = 'Tile placement is not legal.';
export const ERROR_ILLEGAL_MEEPLE = 'Meeple placement is not legal.';
export const ERROR_OCCUPIED_FEATURE = 'Feature already has a meeple.';
export const ERROR_NO_MEEPLES = 'No meeples available.';
export const ERROR_NO_BIG_MEEPLE = 'Big meeple is not available.';
export const ERROR_NO_ABBOT = 'Abbot is not available.';
export const ERROR_NO_ABBOT_ON_BOARD = 'No abbot is currently on the board.';
export const ERROR_SANDBOX_ONLY = 'Sandbox tile selection is only available in sandbox mode.';
export const ERROR_SANDBOX_TILE_UNAVAILABLE = 'Selected tile is not available in the deck.';

export type GameActionResult =
  | { type: 'success'; game: GameState }
  | { type: 'error'; message: string };

export const getActivePlayer = (state: GameState) =>
  state.players[state.activePlayerIndex] ?? null;

export const withEvent = (state: GameState, event: GameEvent): GameState => ({
  ...state,
  eventLog: [
    ...state.eventLog,
    {
      ...event,
      createdAt: event.createdAt ?? new Date().toISOString()
    }
  ].slice(-EVENT_LOG_LIMIT)
});

export const withEvents = (state: GameState, events: GameEvent[]): GameState =>
  events.reduce((next, event) => withEvent(next, event), state);

export const applyScoringResolution = (
  state: GameState,
  resolution: ScoringResolution
): GameState =>
  withEvents(
    {
      ...state,
      players: resolution.players,
      meeples: resolution.meeples
    },
    resolution.events
  );

export const advanceTurn = (state: GameState): GameState => ({
  ...state,
  activePlayerIndex: (state.activePlayerIndex + 1) % state.players.length,
  turnStartedAt: new Date().toISOString(),
  turnNumber: state.turnNumber + 1
});

export const closeTurnAfterMeeplePhase = (state: GameState): GameState =>
  advanceTurn({
    ...state,
    phase: 'draw_tile',
    currentTileId: null,
    currentTileOrientation: null,
    lastPlacedTile: null
  });

export const toGameOverState = (state: GameState, detail: string): GameState =>
  withEvent(
    {
      ...state,
      status: 'finished',
      phase: 'game_over',
      currentTileId: null,
      currentTileOrientation: null,
      lastPlacedTile: null
    },
    {
      turn: state.turnNumber,
      type: 'game_over',
      detail
    }
  );
