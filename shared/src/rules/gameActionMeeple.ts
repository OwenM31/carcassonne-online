/**
 * @description Meeple placement and skip action handlers.
 */
import type {
  GameState,
  PlaceMeepleAction,
  ReturnAbbotAction
} from '../types/game';
import { analyzeBoardFeatures, isConnectedFeatureOccupied } from './featureAnalysis';
import { toFeatureKey } from './featureKeys';
import { isMeeplePlacementValid } from './meeplePlacement';
import {
  applyScoringResolution,
  ERROR_GAME_INACTIVE,
  ERROR_ILLEGAL_MEEPLE,
  ERROR_MEEPLE_PHASE,
  ERROR_NO_ABBOT,
  ERROR_NO_ABBOT_ON_BOARD,
  ERROR_NO_BIG_MEEPLE,
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
  const meepleKind = action.kind ?? 'normal';
  if (meepleKind === 'normal' && activePlayer.meeplesAvailable <= 0) {
    return { type: 'error', message: ERROR_NO_MEEPLES };
  }
  if (meepleKind === 'big' && !activePlayer.bigMeepleAvailable) {
    return { type: 'error', message: ERROR_NO_BIG_MEEPLE };
  }
  if (
    meepleKind === 'abbot' &&
    (!state.addons.includes('abbot') || !activePlayer.abbotAvailable)
  ) {
    return { type: 'error', message: ERROR_NO_ABBOT };
  }
  if (isConnectedFeatureOccupied(state.board, state.meeples, action.placement)) {
    return { type: 'error', message: ERROR_OCCUPIED_FEATURE };
  }
  if (!isMeeplePlacementValid(state, action.placement, meepleKind)) {
    return { type: 'error', message: ERROR_ILLEGAL_MEEPLE };
  }

  const placedState = withEvent(
    {
      ...state,
      players: state.players.map((player) =>
        player.id === action.playerId
          ? {
              ...player,
              meeplesAvailable:
                meepleKind === 'normal' ? player.meeplesAvailable - 1 : player.meeplesAvailable,
              bigMeepleAvailable:
                meepleKind === 'big' ? false : player.bigMeepleAvailable,
              abbotAvailable:
                meepleKind === 'abbot' ? false : player.abbotAvailable
            }
          : player
      ),
      meeples: [
        ...state.meeples,
        { ...action.placement, playerId: action.playerId, kind: meepleKind }
      ]
    },
    {
      turn: state.turnNumber,
      type: 'place_meeple',
      playerId: action.playerId,
      detail: `${activePlayer.name} placed ${
        meepleKind === 'big' ? 'a big meeple' : meepleKind === 'abbot' ? 'an abbot' : 'a meeple'
      } on ${action.placement.featureType} ${action.placement.featureIndex + 1}.`
    }
  );

  return resolveMeeplePhase(placedState);
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

  return resolveMeeplePhase(skippedState);
};

export const applyReturnAbbotAction = (
  state: GameState,
  action: ReturnAbbotAction
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
  if (!state.addons.includes('abbot')) {
    return { type: 'error', message: ERROR_NO_ABBOT };
  }

  const abbotMeeple = state.meeples.find(
    (meeple) => meeple.playerId === action.playerId && meeple.kind === 'abbot'
  );
  if (!abbotMeeple) {
    return { type: 'error', message: ERROR_NO_ABBOT_ON_BOARD };
  }

  const points = scoreReturnedAbbot(state, abbotMeeple);
  const returnedState = withEvent(
    {
      ...state,
      players: state.players.map((player) =>
        player.id === action.playerId
          ? { ...player, score: player.score + points, abbotAvailable: true }
          : player
      ),
      meeples: state.meeples.filter((meeple) => meeple !== abbotMeeple)
    },
    {
      turn: state.turnNumber,
      type: 'return_abbot',
      playerId: action.playerId,
      detail: `${activePlayer.name} returned the abbot for ${points} point${points === 1 ? '' : 's'}.`
    }
  );

  return resolveMeeplePhase(returnedState);
};

function scoreReturnedAbbot(state: GameState, abbotMeeple: GameState['meeples'][number]): number {
  const analysis = analyzeBoardFeatures(state.board);
  const featureKey = toFeatureKey(
    abbotMeeple.tilePosition,
    abbotMeeple.featureType,
    abbotMeeple.featureIndex
  );
  const componentId = analysis.componentByFeatureKey[featureKey];
  if (!componentId) {
    return 0;
  }

  const component = analysis.components.find((entry) => entry.id === componentId);
  if (!component || (component.type !== 'monastery' && component.type !== 'garden')) {
    return 0;
  }

  return 9 - component.openEnds;
}

function resolveMeeplePhase(state: GameState): GameActionResult {
  const scoredState = applyScoringResolution(state, resolveCompletedFeatureScoring(state));

  if (scoredState.tileDeck.length === 0) {
    const finalState = applyScoringResolution(scoredState, resolveFinalScoring(scoredState));
    return {
      type: 'success',
      game: toGameOverState(finalState, 'Final tile placed. Final scoring complete.')
    };
  }

  return { type: 'success', game: closeTurnAfterMeeplePhase(scoredState) };
}
