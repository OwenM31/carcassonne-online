/**
 * @description Board layout helpers for rendering the tile grid.
 */
import type { BoardBounds, Coordinate, TileId } from '@carcassonne/shared';
import type { TileCatalogEntry, TileSource } from '@carcassonne/shared';

export interface BoardGridMetrics {
  columns: number;
  rows: number;
  minX: number;
  minY: number;
  maxY: number;
}

export interface GridPosition {
  column: number;
  row: number;
}

export interface TileSheetMetrics {
  columns: number;
  rows: number;
}

export interface SpriteOffset {
  xRem: number;
  yRem: number;
}

export function getBoardGridMetrics(bounds: BoardBounds): BoardGridMetrics {
  return {
    columns: bounds.maxX - bounds.minX + 1,
    rows: bounds.maxY - bounds.minY + 1,
    minX: bounds.minX,
    minY: bounds.minY,
    maxY: bounds.maxY
  };
}

export function getBoundsWithPositions(
  bounds: BoardBounds,
  positions: Coordinate[]
): BoardBounds {
  if (positions.length === 0) {
    return bounds;
  }

  return positions.reduce<BoardBounds>(
    (next, position) => ({
      minX: Math.min(next.minX, position.x),
      maxX: Math.max(next.maxX, position.x),
      minY: Math.min(next.minY, position.y),
      maxY: Math.max(next.maxY, position.y)
    }),
    { ...bounds }
  );
}

export function toGridPosition(
  position: Coordinate,
  bounds: BoardBounds
): GridPosition {
  return {
    column: position.x - bounds.minX + 1,
    row: bounds.maxY - position.y + 1
  };
}

export function getTileSheetMetrics(
  catalog: TileCatalogEntry[]
): TileSheetMetrics {
  return catalog.reduce<TileSheetMetrics>(
    (metrics, entry) => ({
      columns: Math.max(metrics.columns, entry.source.col),
      rows: Math.max(metrics.rows, entry.source.row)
    }),
    { columns: 0, rows: 0 }
  );
}

export function createTileSourceIndex(
  catalog: TileCatalogEntry[]
): Record<TileId, TileSource> {
  return catalog.reduce<Record<TileId, TileSource>>((index, entry) => {
    index[entry.id] = entry.source;
    return index;
  }, {});
}

export function getSpriteOffset(
  source: TileSource,
  tileSizeRem: number
): SpriteOffset {
  return {
    xRem: -(source.col - 1) * tileSizeRem,
    yRem: -(source.row - 1) * tileSizeRem
  };
}
