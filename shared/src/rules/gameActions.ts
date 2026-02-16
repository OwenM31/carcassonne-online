/**
 * @description Game action dispatcher.
 */
import type { GameAction, GameState } from '../types/game';
import {
  applySkipMeepleAction,
  applyPlaceMeepleAction,
  applyReturnAbbotAction
} from './gameActionMeeple';
import { type GameActionResult } from './gameActionState';
import { applySetTileOrientationAction } from './gameActionOrientation';
import {
  applyDrawSandboxTileAction,
  applyDrawTileAction,
  applyPlaceTileAction
} from './gameActionTile';

export type { GameActionResult } from './gameActionState';

export function applyGameAction(state: GameState, action: GameAction): GameActionResult {
  switch (action.type) {
    case 'draw_tile':
      return applyDrawTileAction(state, action.playerId);
    case 'draw_sandbox_tile':
      return applyDrawSandboxTileAction(state, action);
    case 'set_tile_orientation':
      return applySetTileOrientationAction(state, action);
    case 'place_tile':
      return applyPlaceTileAction(state, action);
    case 'place_meeple':
      return applyPlaceMeepleAction(state, action);
    case 'skip_meeple':
      return applySkipMeepleAction(state, action.playerId);
    case 'return_abbot':
      return applyReturnAbbotAction(state, action);
    default:
      return { type: 'error', message: 'Action not supported yet.' };
  }
}
