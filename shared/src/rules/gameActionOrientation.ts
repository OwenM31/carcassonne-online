/**
 * @description Tile orientation action handler for in-progress placement previews.
 */
import type { GameActionResult } from './gameActionState';
import {
  ERROR_GAME_INACTIVE,
  ERROR_NOT_ACTIVE,
  ERROR_NO_TILE,
  ERROR_ORIENTATION_PHASE,
  getActivePlayer
} from './gameActionState';
import type { GameState, SetTileOrientationAction } from '../types/game';

export const applySetTileOrientationAction = (
  state: GameState,
  action: SetTileOrientationAction
): GameActionResult => {
  if (state.status !== 'active') {
    return { type: 'error', message: ERROR_GAME_INACTIVE };
  }
  if (getActivePlayer(state)?.id !== action.playerId) {
    return { type: 'error', message: ERROR_NOT_ACTIVE };
  }
  if (state.phase !== 'place_tile') {
    return { type: 'error', message: ERROR_ORIENTATION_PHASE };
  }
  if (!state.currentTileId) {
    return { type: 'error', message: ERROR_NO_TILE };
  }
  if (state.currentTileOrientation === action.orientation) {
    return { type: 'success', game: state };
  }

  return {
    type: 'success',
    game: {
      ...state,
      currentTileOrientation: action.orientation
    }
  };
};
