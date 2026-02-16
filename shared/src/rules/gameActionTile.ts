/**
 * @description Draw and tile placement action handlers.
 */
import type { DrawSandboxTileAction, GameState, PlaceTileAction, TileId } from '../types/game';
import { buildCatalogForAddons } from '../tiles';
import { addTileToBoard } from './board';
import {
  getLegalTilePlacementsForState,
  isTilePlacementValidForState
} from './placement';
import {
  applyScoringResolution,
  ERROR_DRAW_PHASE,
  ERROR_GAME_INACTIVE,
  ERROR_ILLEGAL_PLACEMENT,
  ERROR_NOT_ACTIVE,
  ERROR_NO_TILE,
  ERROR_PLACE_PHASE,
  ERROR_SANDBOX_ONLY,
  ERROR_SANDBOX_TILE_UNAVAILABLE,
  ERROR_TILE_MISMATCH,
  advanceTurn,
  getActivePlayer,
  toGameOverState,
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
      game: toGameOverState(scored, 'Tile deck exhausted. Final scoring complete.')
    };
  }

  const [nextTileId, ...remainingDeck] = state.tileDeck;
  return drawResolvedTile(state, playerId, nextTileId, remainingDeck, 'drew');
};

export const applyDrawSandboxTileAction = (
  state: GameState,
  action: DrawSandboxTileAction
): GameActionResult => {
  if (state.mode !== 'sandbox') {
    return { type: 'error', message: ERROR_SANDBOX_ONLY };
  }
  if (state.status !== 'active') {
    return { type: 'error', message: ERROR_GAME_INACTIVE };
  }
  if (getActivePlayer(state)?.id !== action.playerId) {
    return { type: 'error', message: ERROR_NOT_ACTIVE };
  }
  if (state.phase !== 'draw_tile' || state.currentTileId) {
    return { type: 'error', message: ERROR_DRAW_PHASE };
  }
  if (state.tileDeck.length === 0) {
    const scored = applyScoringResolution(state, resolveFinalScoring(state));
    return {
      type: 'success',
      game: toGameOverState(scored, 'Tile deck exhausted. Final scoring complete.')
    };
  }

  const selectedIndex = state.tileDeck.indexOf(action.tileId);
  if (selectedIndex < 0) {
    return { type: 'error', message: ERROR_SANDBOX_TILE_UNAVAILABLE };
  }

  const remainingDeck = [...state.tileDeck];
  remainingDeck.splice(selectedIndex, 1);
  return drawResolvedTile(state, action.playerId, action.tileId, remainingDeck, 'selected');
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
  if (
    !isTilePlacementValidForState(
      state,
      action.tileId,
      action.position,
      action.orientation
    )
  ) {
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
        currentTileOrientation: null,
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

const drawResolvedTile = (
  state: GameState,
  playerId: string,
  tileId: TileId,
  remainingDeck: TileId[],
  drawVerb: 'drew' | 'selected'
): GameActionResult => {
  const placements = getLegalTilePlacementsForState(state, tileId);

  if (placements.length === 0) {
    const discarded = withEvent(
      {
        ...state,
        tileDeck: remainingDeck,
        tileDiscard: [...state.tileDiscard, tileId],
        phase: 'draw_tile',
        currentTileOrientation: null
      },
      {
        turn: state.turnNumber,
        type: 'discard_tile',
        playerId,
        detail: `${getActivePlayer(state)?.name ?? playerId} discarded ${tileId}.`
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
        currentTileId: tileId,
        currentTileOrientation: getDrawOrientation(tileId, state.addons),
        phase: 'place_tile'
      },
      {
        turn: state.turnNumber,
        type: 'draw_tile',
        playerId,
        detail: `${getActivePlayer(state)?.name ?? playerId} ${drawVerb} ${tileId}.`
      }
    )
  };
};

const randomOrientation = (): 0 | 90 | 180 | 270 => {
  const orientations = [0, 90, 180, 270] as const;
  return orientations[Math.floor(Math.random() * orientations.length)];
};

const getDrawOrientation = (
  tileId: TileId,
  addons: GameState['addons']
): 0 | 90 | 180 | 270 => {
  const tile = buildCatalogForAddons(addons).find((entry) => entry.id === tileId);
  if (!tile) {
    return randomOrientation();
  }

  const { N, E, S, W } = tile.features.edges;
  return N === E && E === S && S === W ? 0 : randomOrientation();
};
