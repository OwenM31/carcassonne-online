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
