import {
  ABBOT_AND_INNS_AND_CATHEDRALS_TILE_CATALOG,
  ABBOT_AND_RIVER_2_TILE_CATALOG,
  ABBOT_AND_RIVER_TILE_CATALOG,
  ABBOT_TILE_CATALOG,
  buildCatalogForAddons,
  RIVER_TILE_CATALOG,
  TILE_CATALOG
} from '../src';
import type { Edge, FarmZone } from '../src';

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
    const zones: FarmZone[] = [
      'NNW',
      'NNE',
      'ENE',
      'ESE',
      'SSE',
      'SSW',
      'WSW',
      'WNW',
      'CENTER'
    ];

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

      const usedZones = new Set<FarmZone>();
      for (const farm of farms) {
        expect(farm.zones).not.toHaveLength(0);
        expect(new Set(farm.zones).size).toBe(farm.zones.length);
        for (const zone of farm.zones) {
          expect(zones).toContain(zone);
          expect(usedZones.has(zone)).toBe(false);
          usedZones.add(zone);
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

  it('marks all Abbot add-on tiles with a center garden feature', () => {
    expect(ABBOT_TILE_CATALOG).toHaveLength(8);
    expect(ABBOT_TILE_CATALOG.every((tile) => tile.features.garden === true)).toBe(true);
  });

  it('defines River add-on tiles with expected total count and unique start/end tiles', () => {
    const total = RIVER_TILE_CATALOG.reduce((sum, tile) => sum + tile.count, 0);
    const spring = RIVER_TILE_CATALOG.find((tile) => tile.id === 'RV1_R1C1');
    const lake = RIVER_TILE_CATALOG.find((tile) => tile.id === 'RV1_R3C2');

    expect(total).toBe(12);
    expect(spring?.count).toBe(1);
    expect(lake?.count).toBe(1);
  });

  it('adds combo tiles only when required add-on pairs are active', () => {
    const abbotOnly = buildCatalogForAddons(['abbot']);
    const abbotAndInns = buildCatalogForAddons(['abbot', 'inns_and_cathedrals']);
    const abbotAndRiver = buildCatalogForAddons(['abbot', 'river']);
    const abbotAndRiver2 = buildCatalogForAddons(['abbot', 'river_2']);

    expect(abbotOnly.some((tile) => tile.id === 'ABIC_R1C1')).toBe(false);
    expect(abbotAndInns.some((tile) => tile.id === 'ABIC_R1C1')).toBe(true);
    expect(abbotAndRiver.some((tile) => tile.id === 'ABRV1_R1C1')).toBe(true);
    expect(abbotAndRiver2.some((tile) => tile.id === 'ABRV2_R1C1')).toBe(true);
  });

  it('defines Abbot + Inns & Cathedrals inner-field tile with four separate city stubs', () => {
    const tile = ABBOT_AND_INNS_AND_CATHEDRALS_TILE_CATALOG.find((entry) => entry.id === 'ABIC_R1C2');

    expect(tile).toBeDefined();
    expect(tile?.features.garden).toBe(true);
    expect(tile?.features.cities).toHaveLength(4);
    expect(tile?.features.cities.map((city) => city.edges)).toEqual([['N'], ['E'], ['S'], ['W']]);
    expect(tile?.features.farms).toEqual([{ zones: ['CENTER'] }]);
  });

  it('defines expected combo catalog sizes', () => {
    expect(ABBOT_AND_RIVER_TILE_CATALOG).toHaveLength(1);
    expect(ABBOT_AND_RIVER_2_TILE_CATALOG).toHaveLength(2);
    expect(ABBOT_AND_INNS_AND_CATHEDRALS_TILE_CATALOG).toHaveLength(2);
  });
});
