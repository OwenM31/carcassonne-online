/**
 * @description Internal helper utilities for River 2 placement validation.
 */
import type { BoardState, Coordinate, Orientation, TileId } from '../types/game';
import type { Edge, TileCatalogEntry } from '../tiles';
import { toBoardKey } from './board';
import {
  EDGE_DELTAS,
  getOrientedTileDefinition,
  type OrientedTileDefinition
} from './tileFeatures';

export type TurnDirection = 'left' | 'right' | null;

export interface RiverConnection {
  localEdge: Edge;
  neighborPosition: Coordinate;
  neighborEdge: Edge;
}

const EDGE_ORDER: Edge[] = ['N', 'E', 'S', 'W'];

function getRiverEdges(definition: OrientedTileDefinition): Edge[] {
  return EDGE_ORDER.filter((edge) => definition.edges[edge] === 'river');
}

function hasRiverNeighbor(
  board: BoardState,
  position: Coordinate,
  edge: Edge,
  catalog: TileCatalogEntry[]
): boolean {
  const delta = EDGE_DELTAS[edge];
  const neighborPosition = { x: position.x + delta.dx, y: position.y + delta.dy };
  const neighbor = board.tiles[toBoardKey(neighborPosition)];
  if (!neighbor) {
    return false;
  }

  const neighborDefinition = getOrientedTileDefinition(neighbor.tileId, neighbor.orientation, catalog);
  return neighborDefinition?.edges[delta.opposite] === 'river';
}

function getTurnDirection(from: Edge, to: Edge): TurnDirection {
  const fromIndex = EDGE_ORDER.indexOf(from);
  const toIndex = EDGE_ORDER.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) {
    return null;
  }

  const delta = (toIndex - fromIndex + EDGE_ORDER.length) % EDGE_ORDER.length;
  if (delta === 1) {
    return 'right';
  }
  if (delta === EDGE_ORDER.length - 1) {
    return 'left';
  }
  return null;
}

export function getRiverConnections(
  board: BoardState,
  tileId: TileId,
  position: Coordinate,
  orientation: Orientation,
  catalog: TileCatalogEntry[]
): RiverConnection[] {
  const definition = getOrientedTileDefinition(tileId, orientation, catalog);
  if (!definition) {
    return [];
  }

  return getRiverEdges(definition).flatMap((edge) => {
    const delta = EDGE_DELTAS[edge];
    const neighborPosition = { x: position.x + delta.dx, y: position.y + delta.dy };
    const neighbor = board.tiles[toBoardKey(neighborPosition)];
    if (!neighbor) {
      return [];
    }

    const neighborDefinition = getOrientedTileDefinition(neighbor.tileId, neighbor.orientation, catalog);
    if (neighborDefinition?.edges[delta.opposite] !== 'river') {
      return [];
    }

    return [{ localEdge: edge, neighborPosition, neighborEdge: delta.opposite }];
  });
}

export function getEndpointTurn(
  board: BoardState,
  endpointPosition: Coordinate,
  endpointEdge: Edge,
  catalog: TileCatalogEntry[]
): TurnDirection {
  const endpointTile = board.tiles[toBoardKey(endpointPosition)];
  if (!endpointTile) {
    return null;
  }

  const definition = getOrientedTileDefinition(endpointTile.tileId, endpointTile.orientation, catalog);
  if (!definition) {
    return null;
  }

  const riverEdges = getRiverEdges(definition);
  if (riverEdges.length !== 2 || !riverEdges.includes(endpointEdge)) {
    return null;
  }

  const connectedEdges = riverEdges.filter((edge) =>
    hasRiverNeighbor(board, endpointPosition, edge, catalog)
  );
  if (connectedEdges.length !== 1) {
    return null;
  }

  const incomingDirection = EDGE_DELTAS[connectedEdges[0]].opposite;
  return getTurnDirection(incomingDirection, endpointEdge);
}

export function getPlacedTileTurn(
  tileId: TileId,
  orientation: Orientation,
  connectedEdge: Edge,
  catalog: TileCatalogEntry[]
): TurnDirection {
  const definition = getOrientedTileDefinition(tileId, orientation, catalog);
  if (!definition) {
    return null;
  }

  const riverEdges = getRiverEdges(definition);
  if (riverEdges.length !== 2 || !riverEdges.includes(connectedEdge)) {
    return null;
  }

  const outgoingEdge = riverEdges.find((edge) => edge !== connectedEdge);
  if (!outgoingEdge) {
    return null;
  }

  const incomingDirection = EDGE_DELTAS[connectedEdge].opposite;
  return getTurnDirection(incomingDirection, outgoingEdge);
}

export function isOpenRiverEndpoint(
  board: BoardState,
  endpointPosition: Coordinate,
  endpointEdge: Edge,
  catalog: TileCatalogEntry[]
): boolean {
  const tile = board.tiles[toBoardKey(endpointPosition)];
  if (!tile) {
    return false;
  }

  const definition = getOrientedTileDefinition(tile.tileId, tile.orientation, catalog);
  if (!definition || definition.edges[endpointEdge] !== 'river') {
    return false;
  }

  const delta = EDGE_DELTAS[endpointEdge];
  const neighborPosition = { x: endpointPosition.x + delta.dx, y: endpointPosition.y + delta.dy };
  return !board.tiles[toBoardKey(neighborPosition)];
}
