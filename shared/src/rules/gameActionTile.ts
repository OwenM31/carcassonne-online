/**
 * @description Draw and tile placement action handlers.
 */
import type { GameState, PlaceTileAction } from '../types/game';
import { addTileToBoard } from './board';
import { getLegalTilePlacements, isTilePlacementValid } from './placement';
import {
  applyScoringResolution,
  ERROR_DRAW_PHASE,
  ERROR_GAME_INACTIVE,
  ERROR_ILLEGAL_PLACEMENT,
  ERROR_NOT_ACTIVE,
  ERROR_NO_TILE,
  ERROR_PLACE_PHASE,
  ERROR_TILE_MISMATCH,
  advanceTurn,
  getActivePlayer,
  type GameActionResult,
  withEvent
} from './gameActionState';
import { resolveFinalScoring } from './scoring';

export const applyDrawTileAction = (state: GameState, playerId: string): GameActionResult => {
  if (state.status !== 'active') {
    return { type: 'error', message: ERROR_GAME_INACTIVE };
  }
  if (getActivePlayer(state)?.id !== playerId) {
    return { type: 'error', message: ERROR_NOT_ACTIVE };
  }
  if (state.phase !== 'draw_tile' || state.currentTileId) {
    return { type: 'error', message: ERROR_DRAW_PHASE };
  }
  if (state.tileDeck.length === 0) {
    const scored = applyScoringResolution(state, resolveFinalScoring(state));

    return {
      type: 'success',
      game: withEvent(
        {
          ...scored,
          status: 'finished',
          phase: 'game_over',
          currentTileId: null,
          lastPlacedTile: null
        },
        { turn: state.turnNumber, type: 'game_over', detail: 'Tile deck exhausted.' }
      )
    };
  }

  const [nextTileId, ...remainingDeck] = state.tileDeck;
  const placements = getLegalTilePlacements(state.board, nextTileId);

  if (placements.length === 0) {
    const discarded = withEvent(
      {
        ...state,
        tileDeck: remainingDeck,
        tileDiscard: [...state.tileDiscard, nextTileId],
        phase: 'draw_tile'
      },
      {
        turn: state.turnNumber,
        type: 'discard_tile',
        playerId,
        detail: `${getActivePlayer(state)?.name ?? playerId} discarded ${nextTileId}.`
      }
    );

    return { type: 'success', game: advanceTurn(discarded) };
  }

  return {
    type: 'success',
    game: withEvent(
      {
        ...state,
        tileDeck: remainingDeck,
        currentTileId: nextTileId,
        phase: 'place_tile'
      },
      {
        turn: state.turnNumber,
        type: 'draw_tile',
        playerId,
        detail: `${getActivePlayer(state)?.name ?? playerId} drew ${nextTileId}.`
      }
    )
  };
};

export const applyPlaceTileAction = (
  state: GameState,
  action: PlaceTileAction
): GameActionResult => {
  if (state.status !== 'active') {
    return { type: 'error', message: ERROR_GAME_INACTIVE };
  }
  if (getActivePlayer(state)?.id !== action.playerId) {
    return { type: 'error', message: ERROR_NOT_ACTIVE };
  }
  if (state.phase !== 'place_tile') {
    return { type: 'error', message: ERROR_PLACE_PHASE };
  }
  if (!state.currentTileId) {
    return { type: 'error', message: ERROR_NO_TILE };
  }
  if (action.tileId !== state.currentTileId) {
    return { type: 'error', message: ERROR_TILE_MISMATCH };
  }
  if (!isTilePlacementValid(state.board, action.tileId, action.position, action.orientation)) {
    return { type: 'error', message: ERROR_ILLEGAL_PLACEMENT };
  }

  const placedTile = {
    tileId: action.tileId,
    position: action.position,
    orientation: action.orientation
  } as const;

  return {
    type: 'success',
    game: withEvent(
      {
        ...state,
        board: addTileToBoard(state.board, placedTile),
        phase: 'place_meeple',
        lastPlacedTile: placedTile
      },
      {
        turn: state.turnNumber,
        type: 'place_tile',
        playerId: action.playerId,
        detail: `${getActivePlayer(state)?.name ?? action.playerId} placed ${action.tileId} at ${action.position.x},${action.position.y}.`
      }
    )
  };
};
