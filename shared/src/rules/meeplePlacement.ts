/**
 * @description Legal meeple placement checks for the optional post-tile phase.
 */
import type { GameState, MeeplePlacement, PlayerState } from '../types/game';
import { analyzeBoardFeatures, isConnectedFeatureOccupied } from './featureAnalysis';
import { getOrientedTileDefinition } from './tileFeatures';

function getActivePlayer(state: GameState): PlayerState | null {
  return state.players[state.activePlayerIndex] ?? null;
}

function isOnLastPlacedTile(state: GameState, placement: MeeplePlacement): boolean {
  if (!state.lastPlacedTile) {
    return false;
  }

  return (
    placement.tilePosition.x === state.lastPlacedTile.position.x &&
    placement.tilePosition.y === state.lastPlacedTile.position.y
  );
}

export function getLegalMeeplePlacements(state: GameState): MeeplePlacement[] {
  if (state.phase !== 'place_meeple' || !state.lastPlacedTile) {
    return [];
  }

  const activePlayer = getActivePlayer(state);
  if (!activePlayer || activePlayer.meeplesAvailable <= 0) {
    return [];
  }

  const tile = state.lastPlacedTile;
  const definition = getOrientedTileDefinition(tile.tileId, tile.orientation);
  if (!definition) {
    return [];
  }

  const options: MeeplePlacement[] = [];
  const tilePosition = tile.position;
  definition.cities.forEach((_, index) =>
    options.push({ tilePosition, featureType: 'city', featureIndex: index })
  );
  definition.roads.forEach((_, index) =>
    options.push({ tilePosition, featureType: 'road', featureIndex: index })
  );
  definition.farms.forEach((_, index) =>
    options.push({ tilePosition, featureType: 'farm', featureIndex: index })
  );
  if (definition.monastery) {
    options.push({ tilePosition, featureType: 'monastery', featureIndex: 0 });
  }

  const analysis = analyzeBoardFeatures(state.board);
  return options.filter(
    (option) => !isConnectedFeatureOccupied(state.board, state.meeples, option, analysis)
  );
}

export function isMeeplePlacementValid(
  state: GameState,
  placement: MeeplePlacement
): boolean {
  if (!isOnLastPlacedTile(state, placement)) {
    return false;
  }

  return getLegalMeeplePlacements(state).some(
    (option) =>
      option.tilePosition.x === placement.tilePosition.x &&
      option.tilePosition.y === placement.tilePosition.y &&
      option.featureType === placement.featureType &&
      option.featureIndex === placement.featureIndex
  );
}
