/**
 * @description Renders the tile board using the shared tile catalog.
 */
import type { CSSProperties } from 'react';

import type {
  BoardState,
  MeeplePlacement,
  PlacedMeeple,
  PlayerColor,
  PlacementOption,
  TileId
} from '@carcassonne/shared';
import { TILE_CATALOG } from '@carcassonne/shared';

import {
  createTileSourceIndex,
  getBoundsWithPositions,
  getBoardGridMetrics,
  getSpriteOffset,
  getTileSheetMetrics,
  toGridPosition
} from '../../state/boardLayout';
import { getMeepleAnchor, getMeepleRole } from '../../state/meepleLayout';

const TILE_SIZE_REM = 6;
const TILE_SHEET_URL = '/tiles.png?v=2';
const TILE_SOURCES = createTileSourceIndex(TILE_CATALOG);
const TILE_SHEET = getTileSheetMetrics(TILE_CATALOG);

interface BoardViewProps {
  board: BoardState;
  meeples?: PlacedMeeple[];
  playerColorById?: Record<string, PlayerColor>;
  highlightTileId?: TileId | null;
  placementOptions?: PlacementOption[];
  placementTileId?: TileId | null;
  onPlaceTile?: (placement: PlacementOption) => void;
  meeplePlacementOptions?: MeeplePlacement[];
  onPlaceMeeple?: (placement: MeeplePlacement) => void;
}

export function BoardView({
  board,
  meeples = [],
  playerColorById = {},
  highlightTileId,
  placementOptions = [],
  placementTileId,
  onPlaceTile,
  meeplePlacementOptions = [],
  onPlaceMeeple
}: BoardViewProps) {
  const placementPositions = placementOptions.map((option) => option.position);
  const bounds = getBoundsWithPositions(board.bounds, placementPositions);
  const metrics = getBoardGridMetrics(bounds);
  const placementSource = placementTileId ? TILE_SOURCES[placementTileId] : null;
  const placementSprite = placementSource
    ? getSpriteOffset(placementSource, TILE_SIZE_REM)
    : null;
  const boardStyle = {
    '--tile-size': `${TILE_SIZE_REM}rem`,
    '--tile-gap': '0rem',
    '--board-columns': `${metrics.columns}`,
    '--board-rows': `${metrics.rows}`,
    '--sheet-width': `${TILE_SHEET.columns * TILE_SIZE_REM}rem`,
    '--sheet-height': `${TILE_SHEET.rows * TILE_SIZE_REM}rem`
  } as CSSProperties;

  return (
    <div className="board-shell" style={boardStyle}>
      <div className="board-viewport">
        <div className="board-grid" aria-hidden="true" />
        <div className="board-tiles" role="grid" aria-label="Carcassonne board">
          {Object.entries(board.tiles).map(([key, tile]) => {
            const grid = toGridPosition(tile.position, bounds);
            const source = TILE_SOURCES[tile.tileId];
            const sprite = source ? getSpriteOffset(source, TILE_SIZE_REM) : null;
            const tileStyle = {
              gridColumn: grid.column,
              gridRow: grid.row,
              transform: `rotate(${tile.orientation}deg)`,
              '--tile-offset-x': sprite ? `${sprite.xRem}rem` : '0rem',
              '--tile-offset-y': sprite ? `${sprite.yRem}rem` : '0rem',
              '--tile-sheet': source ? `url("${TILE_SHEET_URL}")` : 'none'
            } as CSSProperties;
            const isHighlighted = highlightTileId === tile.tileId;

            return (
              <div
                key={key}
                className={`board-tile${isHighlighted ? ' board-tile--highlight' : ''}${
                  source ? '' : ' board-tile--missing'
                }`}
                style={tileStyle}
                aria-label={`Tile ${tile.tileId}`}
              >
                {source ? null : <span className="board-tile__label">{tile.tileId}</span>}
              </div>
            );
          })}
          {placementOptions.map((option) => {
            const grid = toGridPosition(option.position, bounds);
            const tileStyle = {
              gridColumn: grid.column,
              gridRow: grid.row,
              transform: `rotate(${option.orientation}deg)`,
              '--tile-offset-x': placementSprite ? `${placementSprite.xRem}rem` : '0rem',
              '--tile-offset-y': placementSprite ? `${placementSprite.yRem}rem` : '0rem',
              '--tile-sheet': placementSource ? `url("${TILE_SHEET_URL}")` : 'none'
            } as CSSProperties;

            const handleClick = () => {
              onPlaceTile?.(option);
            };

            return (
              <button
                key={`placement-${option.position.x}-${option.position.y}-${option.orientation}`}
                type="button"
                className="board-tile board-tile--ghost"
                style={tileStyle}
                onClick={handleClick}
                aria-label={`Place tile at ${option.position.x}, ${option.position.y}`}
              >
                {placementSource ? null : (
                  <span className="board-tile__label">{placementTileId ?? 'Tile'}</span>
                )}
              </button>
            );
          })}
          {meeplePlacementOptions.map((option) => {
            const tile = board.tiles[`${option.tilePosition.x},${option.tilePosition.y}`];
            if (!tile) {
              return null;
            }

            const grid = toGridPosition(option.tilePosition, bounds);
            const anchor = getMeepleAnchor(option, tile);
            const markerStyle = {
              gridColumn: grid.column,
              gridRow: grid.row,
              '--meeple-x': `calc(var(--tile-size) * ${anchor.xPercent} / 100)`,
              '--meeple-y': `calc(var(--tile-size) * ${anchor.yPercent} / 100)`
            } as CSSProperties;
            const role = getMeepleRole(option.featureType);

            return (
              <button
                key={`meeple-placement-${option.tilePosition.x}-${option.tilePosition.y}-${option.featureType}-${option.featureIndex}`}
                type="button"
                className="board-meeple board-meeple-target"
                style={markerStyle}
                onClick={() => onPlaceMeeple?.(option)}
                disabled={!onPlaceMeeple}
                aria-label={`Place ${role} on ${option.featureType} ${option.featureIndex + 1}`}
              >
                <span className="board-meeple__role">{role}</span>
              </button>
            );
          })}
          {meeples.map((meeple, index) => {
            const tile = board.tiles[`${meeple.tilePosition.x},${meeple.tilePosition.y}`];
            if (!tile) {
              return null;
            }

            const grid = toGridPosition(meeple.tilePosition, bounds);
            const anchor = getMeepleAnchor(meeple, tile);
            const color = playerColorById[meeple.playerId] ?? 'black';
            const markerStyle = {
              gridColumn: grid.column,
              gridRow: grid.row,
              '--meeple-x': `${anchor.xPercent}%`,
              '--meeple-y': `${anchor.yPercent}%`
            } as CSSProperties;
            const role = getMeepleRole(meeple.featureType);

            return (
              <div
                key={`${meeple.playerId}-${meeple.tilePosition.x}-${meeple.tilePosition.y}-${meeple.featureType}-${meeple.featureIndex}-${index}`}
                className={`board-meeple board-meeple--${color}`}
                style={markerStyle}
                aria-label={`${role} on ${meeple.featureType}`}
              >
                <span className="board-meeple__role">{role}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
