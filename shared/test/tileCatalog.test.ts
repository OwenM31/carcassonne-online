import { TILE_CATALOG } from '../src';
import type { Corner, Edge } from '../src';

describe('TILE_CATALOG', () => {
  it('defines 24 tile types and totals 72 tiles', () => {
    const total = TILE_CATALOG.reduce((sum, tile) => sum + tile.count, 0);

    expect(TILE_CATALOG).toHaveLength(24);
    expect(total).toBe(72);
  });

  it('uses unique ids and source positions', () => {
    const ids = new Set(TILE_CATALOG.map((tile) => tile.id));
    const sources = new Set(
      TILE_CATALOG.map((tile) => `${tile.source.row},${tile.source.col}`)
    );

    expect(ids.size).toBe(TILE_CATALOG.length);
    expect(sources.size).toBe(TILE_CATALOG.length);
  });

  it('marks exactly one starting tile candidate with count 4', () => {
    const startingTiles = TILE_CATALOG.filter(
      (tile) => tile.startingTileCandidate
    );

    expect(startingTiles).toHaveLength(1);
    expect(startingTiles[0].count).toBe(4);
  });

  it('defines edge and feature metadata for every tile', () => {
    const edges: Edge[] = ['N', 'E', 'S', 'W'];
    const corners: Corner[] = ['NW', 'NE', 'SE', 'SW'];

    for (const tile of TILE_CATALOG) {
      const { edges: edgeMap, cities, roads, farms } = tile.features;

      for (const edge of edges) {
        expect(edgeMap[edge]).toBeDefined();
      }

      for (const edge of edges) {
        const edgeType = edgeMap[edge];
        expect(['city', 'road', 'farm']).toContain(edgeType);
      }

      for (const city of cities) {
        expect(city.edges).not.toHaveLength(0);
        expect(new Set(city.edges).size).toBe(city.edges.length);
        expect(city.pennants).toBeGreaterThanOrEqual(0);
      }

      for (const road of roads) {
        expect(road.edges).not.toHaveLength(0);
        expect(new Set(road.edges).size).toBe(road.edges.length);
      }

      const usedCorners = new Set<Corner>();
      for (const farm of farms) {
        expect(farm.corners).not.toHaveLength(0);
        expect(new Set(farm.corners).size).toBe(farm.corners.length);
        for (const corner of farm.corners) {
          expect(corners).toContain(corner);
          expect(usedCorners.has(corner)).toBe(false);
          usedCorners.add(corner);
        }
      }
    }
  });

  it('treats T_R2C6 north and west city edges as separate city features', () => {
    const tile = TILE_CATALOG.find((entry) => entry.id === 'T_R2C6');

    expect(tile).toBeDefined();
    expect(tile?.features.cities).toHaveLength(2);
    expect(tile?.features.cities[0]?.edges).toEqual(['N']);
    expect(tile?.features.cities[1]?.edges).toEqual(['W']);
  });
});
