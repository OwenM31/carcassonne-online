/**
 * @description Unit tests for deck construction and shuffling.
 */
import { buildTileDeck, shuffleTileDeck, TILE_CATALOG } from '../src';

describe('buildTileDeck', () => {
  it('expands catalog entries into a 72-tile deck', () => {
    const deck = buildTileDeck();
    const counts: Record<string, number> = {};

    for (const tileId of deck) {
      counts[tileId] = (counts[tileId] ?? 0) + 1;
    }

    expect(deck).toHaveLength(72);

    for (const tile of TILE_CATALOG) {
      expect(counts[tile.id] ?? 0).toBe(tile.count);
    }
  });

  it('builds a small deck using ceil(count/2) per tile type', () => {
    const deck = buildTileDeck(TILE_CATALOG, 'small');
    const counts: Record<string, number> = {};

    for (const tileId of deck) {
      counts[tileId] = (counts[tileId] ?? 0) + 1;
    }

    expect(deck).toHaveLength(43);

    for (const tile of TILE_CATALOG) {
      expect(counts[tile.id] ?? 0).toBe(Math.ceil(tile.count / 2));
    }
  });

  it('keeps all River 2 tiles in small-deck mode', () => {
    const deck = buildTileDeck(undefined, 'small', ['river_2']);
    const riverTiles = deck.filter((tileId) => tileId.startsWith('RV2_'));

    expect(riverTiles).toHaveLength(12);
    expect(deck).toHaveLength(55);
  });

  it('keeps all River tiles in small-deck mode', () => {
    const deck = buildTileDeck(undefined, 'small', ['river']);
    const riverTiles = deck.filter((tileId) => tileId.startsWith('RV1_'));

    expect(riverTiles).toHaveLength(12);
    expect(deck).toHaveLength(55);
  });

  it('uses 22 total river tiles in small-deck mode when River and River 2 are both enabled', () => {
    const deck = buildTileDeck(undefined, 'small', ['river', 'river_2']);
    const riverTiles = deck.filter((tileId) => tileId.startsWith('RV1_') || tileId.startsWith('RV2_'));

    expect(riverTiles).toHaveLength(22);
    expect(deck).toHaveLength(65);
    expect(deck).not.toContain('RV1_R1C1');
    expect(deck).not.toContain('RV1_R3C2');
  });

  it('adds all Abbot garden tiles in both standard and small deck sizes', () => {
    const standardDeck = buildTileDeck(undefined, 'standard', ['abbot']);
    const smallDeck = buildTileDeck(undefined, 'small', ['abbot']);
    const countAbbotTiles = (deck: string[]) =>
      deck.filter((tileId) => tileId.startsWith('AB_')).length;

    expect(countAbbotTiles(standardDeck)).toBe(8);
    expect(standardDeck).toHaveLength(80);
    expect(countAbbotTiles(smallDeck)).toBe(8);
    expect(smallDeck).toHaveLength(51);
  });

  it('adds combo tiles automatically when required add-ons are active', () => {
    const abbotInnsDeck = buildTileDeck(undefined, 'standard', ['abbot', 'inns_and_cathedrals']);
    const abbotRiverDeck = buildTileDeck(undefined, 'standard', ['abbot', 'river']);
    const abbotRiver2Deck = buildTileDeck(undefined, 'standard', ['abbot', 'river_2']);

    expect(abbotInnsDeck.filter((tileId) => tileId.startsWith('ABIC_'))).toHaveLength(2);
    expect(abbotRiverDeck.filter((tileId) => tileId.startsWith('ABRV1_'))).toHaveLength(1);
    expect(abbotRiver2Deck.filter((tileId) => tileId.startsWith('ABRV2_'))).toHaveLength(2);
  });

  it('shuffles a deck without mutating the input when a random source is provided', () => {
    const deck = ['A', 'B', 'C', 'D'];
    const randomValues = [0.9, 0.1, 0.2];
    let randomIndex = 0;

    const shuffled = shuffleTileDeck(deck, () => {
      const value = randomValues[randomIndex] ?? 0;
      randomIndex += 1;
      return value;
    });

    expect(shuffled).toEqual(['B', 'C', 'A', 'D']);
    expect(deck).toEqual(['A', 'B', 'C', 'D']);
  });
});
