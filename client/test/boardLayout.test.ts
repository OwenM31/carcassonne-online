/**
 * @description Unit tests for board layout helpers.
 */
import type { BoardBounds, TileCatalogEntry } from '@carcassonne/shared';

import {
  createTileSourceIndex,
  getBoardGridMetrics,
  getSpriteOffset,
  getBoundsWithPositions,
  getTileSheetMetrics,
  toGridPosition
} from '../src/state/boardLayout';

const EMPTY_FEATURES: TileCatalogEntry['features'] = {
  edges: { N: 'farm', E: 'farm', S: 'farm', W: 'farm' },
  cities: [],
  roads: [],
  farms: [],
  monastery: false
};

const makeEntry = (id: string, row: number, col: number): TileCatalogEntry => ({
  id,
  label: id,
  count: 1,
  source: { sheet: 'tiles.png', row, col },
  startingTileCandidate: false,
  features: EMPTY_FEATURES
});

describe('boardLayout', () => {
  it('computes grid metrics from bounds', () => {
    const bounds: BoardBounds = { minX: -2, maxX: 1, minY: -1, maxY: 2 };
    const metrics = getBoardGridMetrics(bounds);

    expect(metrics).toEqual({
      columns: 4,
      rows: 4,
      minX: -2,
      minY: -1,
      maxY: 2
    });
  });

  it('expands bounds to include additional positions', () => {
    const bounds: BoardBounds = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    const expanded = getBoundsWithPositions(bounds, [
      { x: -2, y: 3 },
      { x: 4, y: -1 }
    ]);

    expect(expanded).toEqual({ minX: -2, maxX: 4, minY: -1, maxY: 3 });
  });

  it('maps coordinates to grid positions with north at the top', () => {
    const bounds: BoardBounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };

    expect(toGridPosition({ x: 1, y: 1 }, bounds)).toEqual({ column: 3, row: 1 });
    expect(toGridPosition({ x: 0, y: 0 }, bounds)).toEqual({ column: 2, row: 2 });
    expect(toGridPosition({ x: -1, y: -1 }, bounds)).toEqual({ column: 1, row: 3 });
  });

  it('derives tile sheet metrics from catalog entries', () => {
    const catalog = [makeEntry('A', 1, 2), makeEntry('B', 3, 1)];

    expect(getTileSheetMetrics(catalog)).toEqual({ columns: 2, rows: 3 });
  });

  it('indexes tile sources by id', () => {
    const catalog = [makeEntry('A', 1, 2), makeEntry('B', 3, 1)];
    const index = createTileSourceIndex(catalog);

    expect(index.A).toEqual({ sheet: 'tiles.png', row: 1, col: 2 });
    expect(index.B).toEqual({ sheet: 'tiles.png', row: 3, col: 1 });
  });

  it('builds sprite offsets from tile source', () => {
    const offset = getSpriteOffset({ sheet: 'tiles.png', row: 2, col: 3 }, 6);

    expect(offset).toEqual({ xRem: -12, yRem: -6 });
  });
});
