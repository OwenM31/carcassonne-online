/**
 * @description Board state helpers for tile placement.
 */
import { BoardState, Coordinate, PlacedTile } from '../types/game';

export function toBoardKey(position: Coordinate): string {
  return `${position.x},${position.y}`;
}

export function createBoardWithTile(tile: PlacedTile): BoardState {
  const key = toBoardKey(tile.position);

  return {
    tiles: {
      [key]: tile
    },
    bounds: {
      minX: tile.position.x,
      maxX: tile.position.x,
      minY: tile.position.y,
      maxY: tile.position.y
    }
  };
}

export function addTileToBoard(board: BoardState, tile: PlacedTile): BoardState {
  const key = toBoardKey(tile.position);
  const bounds = {
    minX: Math.min(board.bounds.minX, tile.position.x),
    maxX: Math.max(board.bounds.maxX, tile.position.x),
    minY: Math.min(board.bounds.minY, tile.position.y),
    maxY: Math.max(board.bounds.maxY, tile.position.y)
  };

  return {
    tiles: {
      ...board.tiles,
      [key]: tile
    },
    bounds
  };
}
