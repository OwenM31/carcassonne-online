/**
 * @description Legal meeple placement checks for the optional post-tile phase.
 */
import type {
  GameState,
  MeepleKind,
  MeeplePlacement,
  PlayerState
} from '../types/game';
import { analyzeBoardFeatures, isConnectedFeatureOccupied } from './featureAnalysis';
import { getOrientedTileDefinition } from './tileFeatures';

export type MeeplePlacementKind = MeepleKind | 'any';

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

function hasAbbotAddon(state: GameState): boolean {
  return state.addons.includes('abbot');
}

function resolvePlacementCapabilities(
  state: GameState,
  activePlayer: PlayerState,
  kind: MeeplePlacementKind
): { canPlaceFollower: boolean; canPlaceAbbot: boolean } {
  if (kind === 'normal') {
    return {
      canPlaceFollower: activePlayer.meeplesAvailable > 0,
      canPlaceAbbot: false
    };
  }

  if (kind === 'big') {
    return {
      canPlaceFollower: activePlayer.bigMeepleAvailable,
      canPlaceAbbot: false
    };
  }

  if (kind === 'abbot') {
    return {
      canPlaceFollower: false,
      canPlaceAbbot: hasAbbotAddon(state) && activePlayer.abbotAvailable
    };
  }

  return {
    canPlaceFollower:
      activePlayer.meeplesAvailable > 0 || activePlayer.bigMeepleAvailable,
    canPlaceAbbot: hasAbbotAddon(state) && activePlayer.abbotAvailable
  };
}

function dedupePlacements(options: MeeplePlacement[]): MeeplePlacement[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = `${option.tilePosition.x},${option.tilePosition.y}:${option.featureType}:${option.featureIndex}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getLegalMeeplePlacements(
  state: GameState,
  kind: MeeplePlacementKind = 'any'
): MeeplePlacement[] {
  if (state.phase !== 'place_meeple' || !state.lastPlacedTile) {
    return [];
  }

  const activePlayer = getActivePlayer(state);
  if (!activePlayer) {
    return [];
  }

  const { canPlaceFollower, canPlaceAbbot } = resolvePlacementCapabilities(
    state,
    activePlayer,
    kind
  );
  if (!canPlaceFollower && !canPlaceAbbot) {
    return [];
  }

  const tile = state.lastPlacedTile;
  const definition = getOrientedTileDefinition(tile.tileId, tile.orientation);
  if (!definition) {
    return [];
  }

  const options: MeeplePlacement[] = [];
  const tilePosition = tile.position;
  if (canPlaceFollower) {
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
  }

  if (canPlaceAbbot) {
    if (definition.monastery) {
      options.push({ tilePosition, featureType: 'monastery', featureIndex: 0 });
    }
    if (definition.garden) {
      options.push({ tilePosition, featureType: 'garden', featureIndex: 0 });
    }
  }

  const analysis = analyzeBoardFeatures(state.board);
  return dedupePlacements(options).filter(
    (option) => !isConnectedFeatureOccupied(state.board, state.meeples, option, analysis)
  );
}

export function isMeeplePlacementValid(
  state: GameState,
  placement: MeeplePlacement,
  kind: MeepleKind = 'normal'
): boolean {
  if (!isOnLastPlacedTile(state, placement)) {
    return false;
  }

  return getLegalMeeplePlacements(state, kind).some(
    (option) =>
      option.tilePosition.x === placement.tilePosition.x &&
      option.tilePosition.y === placement.tilePosition.y &&
      option.featureType === placement.featureType &&
      option.featureIndex === placement.featureIndex
  );
}
