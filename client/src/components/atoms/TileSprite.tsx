/**
 * @description Renders a tile sprite from the shared tile sheet.
 */
import type { CSSProperties } from 'react';

import { TILE_CATALOG, type Orientation, type TileId } from '@carcassonne/shared';

import {
  createTileSourceIndex,
  getSpriteOffset,
  getTileSheetMetrics
} from '../../state/boardLayout';

const TILE_SHEET_URL = '/tiles.png?v=2';
const TILE_SOURCES = createTileSourceIndex(TILE_CATALOG);
const TILE_SHEET = getTileSheetMetrics(TILE_CATALOG);

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
  const style = {
    '--tile-size': `${sizeRem}rem`,
    '--tile-offset-x': `${sprite.xRem}rem`,
    '--tile-offset-y': `${sprite.yRem}rem`,
    '--tile-sheet': `url("${TILE_SHEET_URL}")`,
    '--sheet-width': `${TILE_SHEET.columns * sizeRem}rem`,
    '--sheet-height': `${TILE_SHEET.rows * sizeRem}rem`,
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
