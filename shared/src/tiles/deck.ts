import { TileId } from '../types/game';
import type { SessionAddon, SessionDeckSize } from '../types/session';
import {
  buildCatalogForAddons,
  TILE_CATALOG,
  TileCatalogEntry
} from './catalog';
import { isRiverAddonTileId } from './river2';

export type RandomSource = () => number;
const STANDARD_DECK_SIZE: SessionDeckSize = 'standard';

function getTileCountForDeck(
  tileId: TileId,
  tileCount: number,
  deckSize: SessionDeckSize
): number {
  if (deckSize === 'small' && isRiverAddonTileId(tileId)) {
    return tileCount;
  }

  if (deckSize === 'small') {
    return Math.ceil(tileCount / 2);
  }

  return tileCount;
}

export function buildTileDeck(
  catalog: TileCatalogEntry[] = TILE_CATALOG,
  deckSize: SessionDeckSize = STANDARD_DECK_SIZE,
  addons: SessionAddon[] = []
): TileId[] {
  const activeCatalog = catalog === TILE_CATALOG ? buildCatalogForAddons(addons) : catalog;
  const deck: TileId[] = [];

  for (const tile of activeCatalog) {
    const copies = getTileCountForDeck(tile.id, tile.count, deckSize);
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
  catalog: TileCatalogEntry[] = TILE_CATALOG,
  addons: SessionAddon[] = []
): TileId[] {
  const activeCatalog = catalog === TILE_CATALOG ? buildCatalogForAddons(addons) : catalog;
  return activeCatalog
    .filter((tile) => tile.startingTileCandidate)
    .map((tile) => tile.id);
}
