/**
 * @description Meeple placement and skip action handlers.
 */
import type { GameState, PlaceMeepleAction } from '../types/game';
import { isConnectedFeatureOccupied } from './featureAnalysis';
import { isMeeplePlacementValid } from './meeplePlacement';
import {
  applyScoringResolution,
  ERROR_GAME_INACTIVE,
  ERROR_ILLEGAL_MEEPLE,
  ERROR_MEEPLE_PHASE,
  ERROR_NOT_ACTIVE,
  ERROR_NO_MEEPLES,
  ERROR_OCCUPIED_FEATURE,
  closeTurnAfterMeeplePhase,
  getActivePlayer,
  toGameOverState,
  type GameActionResult,
  withEvent
} from './gameActionState';
import { resolveCompletedFeatureScoring, resolveFinalScoring } from './scoring';

export const applyPlaceMeepleAction = (
  state: GameState,
  action: PlaceMeepleAction
): GameActionResult => {
  if (state.status !== 'active') {
    return { type: 'error', message: ERROR_GAME_INACTIVE };
  }
  if (state.phase !== 'place_meeple') {
    return { type: 'error', message: ERROR_MEEPLE_PHASE };
  }

  const activePlayer = getActivePlayer(state);
  if (!activePlayer || activePlayer.id !== action.playerId) {
    return { type: 'error', message: ERROR_NOT_ACTIVE };
  }
  if (activePlayer.meeplesAvailable <= 0) {
    return { type: 'error', message: ERROR_NO_MEEPLES };
  }
  if (isConnectedFeatureOccupied(state.board, state.meeples, action.placement)) {
    return { type: 'error', message: ERROR_OCCUPIED_FEATURE };
  }
  if (!isMeeplePlacementValid(state, action.placement)) {
    return { type: 'error', message: ERROR_ILLEGAL_MEEPLE };
  }

  const placedState = withEvent(
    {
      ...state,
      players: state.players.map((player) =>
        player.id === action.playerId
          ? { ...player, meeplesAvailable: player.meeplesAvailable - 1 }
          : player
      ),
      meeples: [...state.meeples, { ...action.placement, playerId: action.playerId }]
    },
    {
      turn: state.turnNumber,
      type: 'place_meeple',
      playerId: action.playerId,
      detail: `${activePlayer.name} placed a meeple on ${action.placement.featureType} ${action.placement.featureIndex + 1}.`
    }
  );

  const scoredState = applyScoringResolution(
    placedState,
    resolveCompletedFeatureScoring(placedState)
  );

  if (scoredState.tileDeck.length === 0) {
    const finalState = applyScoringResolution(
      scoredState,
      resolveFinalScoring(scoredState)
    );
    return {
      type: 'success',
      game: toGameOverState(finalState, 'Final tile placed. Final scoring complete.')
    };
  }

  return { type: 'success', game: closeTurnAfterMeeplePhase(scoredState) };
};

export const applySkipMeepleAction = (
  state: GameState,
  playerId: string
): GameActionResult => {
  if (state.status !== 'active') {
    return { type: 'error', message: ERROR_GAME_INACTIVE };
  }
  if (state.phase !== 'place_meeple') {
    return { type: 'error', message: ERROR_MEEPLE_PHASE };
  }
  if (getActivePlayer(state)?.id !== playerId) {
    return { type: 'error', message: ERROR_NOT_ACTIVE };
  }

  const skippedState = withEvent(state, {
    turn: state.turnNumber,
    type: 'skip_meeple',
    playerId,
    detail: `${getActivePlayer(state)?.name ?? playerId} skipped meeple placement.`
  });

  const scoredState = applyScoringResolution(
    skippedState,
    resolveCompletedFeatureScoring(skippedState)
  );

  if (scoredState.tileDeck.length === 0) {
    const finalState = applyScoringResolution(
      scoredState,
      resolveFinalScoring(scoredState)
    );
    return {
      type: 'success',
      game: toGameOverState(finalState, 'Final tile placed. Final scoring complete.')
    };
  }

  return { type: 'success', game: closeTurnAfterMeeplePhase(scoredState) };
};
