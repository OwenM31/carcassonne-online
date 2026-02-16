/**
 * @description River add-on helpers for opening-deck ordering and tile counters.
 */
import type { TileId } from '../types/game';
import type { SessionAddon } from '../types/session';
import {
  ABBOT_AND_RIVER_2_TILE_CATALOG,
  ABBOT_AND_RIVER_TILE_CATALOG,
  RIVER_2_END_TILE_IDS,
  RIVER_2_SECOND_TILE_ID,
  RIVER_2_START_TILE_ID,
  RIVER_END_TILE_ID,
  RIVER_START_TILE_ID,
  isRiver2TileId,
  isRiverTileId
} from './catalog';

const RIVER_2_END_TILE_ID_SET = new Set<TileId>(RIVER_2_END_TILE_IDS);
const ABBOT_AND_RIVER_TILE_ID_SET = new Set<TileId>(
  ABBOT_AND_RIVER_TILE_CATALOG.map((tile) => tile.id)
);
const ABBOT_AND_RIVER_2_TILE_ID_SET = new Set<TileId>(
  ABBOT_AND_RIVER_2_TILE_CATALOG.map((tile) => tile.id)
);

export function hasRiver(addons: SessionAddon[]): boolean {
  return addons.includes('river');
}

export function hasRiver2(addons: SessionAddon[]): boolean {
  return addons.includes('river_2');
}

export function hasAnyRiver(addons: SessionAddon[]): boolean {
  return hasRiver(addons) || hasRiver2(addons);
}

export function isRiverAddonTileId(tileId: TileId): boolean {
  return (
    isRiverTileId(tileId) ||
    isRiver2TileId(tileId) ||
    ABBOT_AND_RIVER_TILE_ID_SET.has(tileId) ||
    ABBOT_AND_RIVER_2_TILE_ID_SET.has(tileId)
  );
}

export function countRiverTiles(tileDeck: TileId[]): number {
  return tileDeck.reduce((count, tileId) => count + (isRiverAddonTileId(tileId) ? 1 : 0), 0);
}

export function countRiver2Tiles(tileDeck: TileId[]): number {
  return tileDeck.reduce((count, tileId) => count + (isRiver2TileId(tileId) ? 1 : 0), 0);
}

export function orderRiverDeckForStandard(
  shuffledDeck: TileId[],
  addons: SessionAddon[]
): TileId[] {
  const includeRiver = hasRiver(addons);
  const includeRiver2 = hasRiver2(addons);
  if (!includeRiver && !includeRiver2) {
    return [...shuffledDeck];
  }

  const excludeRiverOneEndpoints = includeRiver && includeRiver2;
  const riverSecond: TileId[] = [];
  const riverMiddle: TileId[] = [];
  const riverEnd: TileId[] = [];
  const nonRiver: TileId[] = [];

  shuffledDeck.forEach((tileId) => {
    if (
      (includeRiver && tileId === RIVER_START_TILE_ID) ||
      (includeRiver2 && tileId === RIVER_2_START_TILE_ID)
    ) {
      return;
    }

    if (includeRiver2 && tileId === RIVER_2_SECOND_TILE_ID) {
      riverSecond.push(tileId);
      return;
    }

    if (includeRiver2 && RIVER_2_END_TILE_ID_SET.has(tileId)) {
      riverEnd.push(tileId);
      return;
    }

    if (includeRiver && tileId === RIVER_END_TILE_ID) {
      if (!excludeRiverOneEndpoints) {
        riverEnd.push(tileId);
      }
      return;
    }

    if (isRiverAddonTileId(tileId)) {
      riverMiddle.push(tileId);
      return;
    }

    nonRiver.push(tileId);
  });

  return [...riverSecond, ...riverMiddle, ...riverEnd, ...nonRiver];
}

export function orderRiver2DeckForStandard(shuffledDeck: TileId[]): TileId[] {
  return orderRiverDeckForStandard(shuffledDeck, ['river_2']);
}
