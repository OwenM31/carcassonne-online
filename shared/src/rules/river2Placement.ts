/**
 * @description River add-on placement restrictions for standard-mode opening setup.
 */
import type { Coordinate, GameState, Orientation, TileId } from '../types/game';
import type { TileCatalogEntry } from '../tiles';
import { hasAnyRiver, isRiverAddonTileId } from '../tiles';
import {
  getEndpointTurn,
  getPlacedTileTurn,
  getRiverConnections,
  isOpenRiverEndpoint
} from './river2PlacementHelpers';

export function isRiverPlacementPhase(state: GameState, tileId: TileId): boolean {
  return state.mode === 'standard' && hasAnyRiver(state.addons) && isRiverAddonTileId(tileId);
}

export function isRiverPlacementAllowed(
  state: GameState,
  tileId: TileId,
  position: Coordinate,
  orientation: Orientation,
  catalog: TileCatalogEntry[]
): boolean {
  if (!isRiverPlacementPhase(state, tileId)) {
    return true;
  }

  const riverConnections = getRiverConnections(state.board, tileId, position, orientation, catalog);
  if (riverConnections.length !== 1) {
    return false;
  }

  const [connection] = riverConnections;
  if (
    !isOpenRiverEndpoint(state.board, connection.neighborPosition, connection.neighborEdge, catalog)
  ) {
    return false;
  }

  const previousTurn = getEndpointTurn(
    state.board,
    connection.neighborPosition,
    connection.neighborEdge,
    catalog
  );
  const nextTurn = getPlacedTileTurn(
    tileId,
    orientation,
    connection.localEdge,
    catalog
  );

  return !(previousTurn && nextTurn && previousTurn === nextTurn);
}

export function isRiver2PlacementPhase(state: GameState, tileId: TileId): boolean {
  return isRiverPlacementPhase(state, tileId);
}

export function isRiver2PlacementAllowed(
  state: GameState,
  tileId: TileId,
  position: Coordinate,
  orientation: Orientation,
  catalog: TileCatalogEntry[]
): boolean {
  return isRiverPlacementAllowed(state, tileId, position, orientation, catalog);
}
