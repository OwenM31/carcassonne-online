import { TileId } from '../types/game';
import type { SessionDeckSize } from '../types/session';
import { TILE_CATALOG, TileCatalogEntry } from './catalog';

export type RandomSource = () => number;
const STANDARD_DECK_SIZE: SessionDeckSize = 'standard';

function getTileCountForDeck(tileCount: number, deckSize: SessionDeckSize): number {
  if (deckSize === 'small') {
    return Math.ceil(tileCount / 2);
  }

  return tileCount;
}

export function buildTileDeck(
  catalog: TileCatalogEntry[] = TILE_CATALOG,
  deckSize: SessionDeckSize = STANDARD_DECK_SIZE
): TileId[] {
  const deck: TileId[] = [];

  for (const tile of catalog) {
    const copies = getTileCountForDeck(tile.count, deckSize);
    for (let index = 0; index < copies; index += 1) {
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
