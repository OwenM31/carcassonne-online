import { TileId } from '../types/game';
import { TILE_CATALOG, TileCatalogEntry } from './catalog';

export type RandomSource = () => number;

export function buildTileDeck(
  catalog: TileCatalogEntry[] = TILE_CATALOG
): TileId[] {
  const deck: TileId[] = [];

  for (const tile of catalog) {
    for (let index = 0; index < tile.count; index += 1) {
      deck.push(tile.id);
    }
  }

  return deck;
}

export function shuffleTileDeck(
  sourceDeck: TileId[],
  random: RandomSource = Math.random
): TileId[] {
  const deck = [...sourceDeck];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = deck[index];
    deck[index] = deck[swapIndex];
    deck[swapIndex] = current;
  }

  return deck;
}

export function getStartingTileCandidates(
  catalog: TileCatalogEntry[] = TILE_CATALOG
): TileId[] {
  return catalog
    .filter((tile) => tile.startingTileCandidate)
    .map((tile) => tile.id);
}
