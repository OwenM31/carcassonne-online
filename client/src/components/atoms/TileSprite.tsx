/**
 * @description Renders a tile sprite from the shared tile sheet.
 */
import type { CSSProperties } from 'react';

import { FULL_TILE_CATALOG, type Orientation, type TileId } from '@carcassonne/shared';

import {
  createTileSourceIndex,
  getSpriteOffset,
  getTileSheetMetricsBySheet
} from '../../state/boardLayout';

const TILE_SHEET_URLS: Record<string, string> = {
  'tiles.png': '/tiles.png?v=2',
  'tiles-inns-and-cathedrals.png': '/tiles-inns-and-cathedrals.png?v=1',
  'tiles-river.png': '/tiles-river.png?v=1',
  'tiles-river-2.png': '/tiles-river-2.png?v=1',
  'tiles-abbot.png': '/tiles-abbot.png?v=1',
  'tiles-abbot-river.png': '/tiles-abbot-river.png?v=1',
  'tiles-abbot-river-2.png': '/tiles-abbot-river-2.png?v=1',
  'tiles-abbot-inns-and-cathedrals.png': '/tiles-abbot-inns-and-cathedrals.png?v=1'
};
const TILE_SOURCES = createTileSourceIndex(FULL_TILE_CATALOG);
const TILE_SHEETS = getTileSheetMetricsBySheet(FULL_TILE_CATALOG);

interface TileSpriteProps {
  tileId: TileId;
  sizeRem: number;
  orientation?: Orientation;
  className?: string;
}

export function TileSprite({
  tileId,
  sizeRem,
  orientation = 0,
  className
}: TileSpriteProps) {
  const source = TILE_SOURCES[tileId];

  if (!source) {
    const fallbackStyle = {
      '--tile-size': `${sizeRem}rem`
    } as CSSProperties;

    return (
      <div
        className={['tile-sprite', 'tile-sprite--missing', className].filter(Boolean).join(' ')}
        style={fallbackStyle}
      >
        {tileId}
      </div>
    );
  }

  const sprite = getSpriteOffset(source, sizeRem);
  const sheetMetrics = TILE_SHEETS[source.sheet] ?? { columns: 1, rows: 1 };
  const style = {
    '--tile-size': `${sizeRem}rem`,
    '--tile-offset-x': `${sprite.xRem}rem`,
    '--tile-offset-y': `${sprite.yRem}rem`,
    '--tile-sheet': `url("${TILE_SHEET_URLS[source.sheet] ?? TILE_SHEET_URLS['tiles.png']}")`,
    '--sheet-width': `${sheetMetrics.columns * sizeRem}rem`,
    '--sheet-height': `${sheetMetrics.rows * sizeRem}rem`,
    transform: `rotate(${orientation}deg)`
  } as CSSProperties;

  return (
    <div
      className={['tile-sprite', className].filter(Boolean).join(' ')}
      style={style}
      aria-label={`Tile ${tileId}`}
    />
  );
}
