/**
 * @description Helpers for deriving sandbox tile picker data from the remaining deck.
 */
import { FULL_TILE_CATALOG, type TileId } from '@carcassonne/shared';

export interface SandboxDeckEntry {
  tileId: TileId;
  remaining: number;
}

export function buildSandboxDeckEntries(tileDeck: TileId[]): SandboxDeckEntry[] {
  const counts = tileDeck.reduce<Record<string, number>>((index, tileId) => {
    index[tileId] = (index[tileId] ?? 0) + 1;
    return index;
  }, {});

  return FULL_TILE_CATALOG.map((tile) => ({ tileId: tile.id, remaining: counts[tile.id] ?? 0 })).filter(
    (entry) => entry.remaining > 0
  );
}
