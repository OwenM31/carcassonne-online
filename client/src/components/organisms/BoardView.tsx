/**
 * @description Renders the tile board using the shared tile catalog.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent
} from 'react';

import type {
  BoardState,
  MeeplePlacement,
  PlacedMeeple,
  PlayerColor,
  PlacementOption,
  TileId
} from '@carcassonne/shared';
import { FULL_TILE_CATALOG } from '@carcassonne/shared';

import {
  createTileSourceIndex,
  getBoundsWithPositions,
  getBoardGridMetrics,
  getSpriteOffset,
  getTileSheetMetricsBySheet,
  toGridPosition
} from '../../state/boardLayout';
import { getMeepleAnchor, getMeepleRole, getMeepleRoleLabel } from '../../state/meepleLayout';
import { getMeepleSprites } from '../../state/meepleSprites';

const TILE_SIZE_REM = 6;
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
const BASE_SHEET = TILE_SHEETS['tiles.png'] ?? { columns: 1, rows: 1 };
const FIT_PADDING_PX = 24;
const MIN_ZOOM = 0.24;
const MAX_ZOOM = 2.2;
const ZOOM_STEP = 1.15;

interface BoardCamera {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
}

interface BoardViewProps {
  board: BoardState;
  meeples?: PlacedMeeple[];
  playerColorById?: Record<string, PlayerColor>;
  autoZoomOnNewTile?: boolean;
  highlightTileId?: TileId | null;
  placementOptions?: PlacementOption[];
  placementTileId?: TileId | null;
  onPlaceTile?: (placement: PlacementOption) => void;
  meeplePlacementOptions?: MeeplePlacement[];
  onPlaceMeeple?: (placement: MeeplePlacement) => void;
  onOpenRules?: () => void;
}

export function BoardView({
  board,
  meeples = [],
  playerColorById = {},
  autoZoomOnNewTile = false,
  highlightTileId,
  placementOptions = [],
  placementTileId,
  onPlaceTile,
  meeplePlacementOptions = [],
  onPlaceMeeple,
  onOpenRules
}: BoardViewProps) {
  const placementPositions = placementOptions.map((option) => option.position);
  const bounds = getBoundsWithPositions(board.bounds, placementPositions);
  const metrics = getBoardGridMetrics(bounds);
  const boardShapeKey = `${bounds.minX}:${bounds.maxX}:${bounds.minY}:${bounds.maxY}:${Object.keys(board.tiles).length}`;
  const placementSource = placementTileId ? TILE_SOURCES[placementTileId] : null;
  const placementSprite = placementSource
    ? getSpriteOffset(placementSource, TILE_SIZE_REM)
    : null;
  const placementSheet = placementSource ? TILE_SHEETS[placementSource.sheet] ?? BASE_SHEET : BASE_SHEET;
  const shellRef = useRef<HTMLDivElement | null>(null);
  const hasFittedRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const [camera, setCamera] = useState<BoardCamera>({
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });
  const normalMeepleSprites = getMeepleSprites('normal');
  const bigMeepleSprites = getMeepleSprites('big');
  const abbotMeepleSprites = getMeepleSprites('abbot');
  const boardStyle = {
    '--tile-size': `${TILE_SIZE_REM}rem`,
    '--tile-gap': '0rem',
    '--board-columns': `${metrics.columns}`,
    '--board-rows': `${metrics.rows}`,
    '--sheet-width': `${BASE_SHEET.columns * TILE_SIZE_REM}rem`,
    '--sheet-height': `${BASE_SHEET.rows * TILE_SIZE_REM}rem`,
    '--board-scale': `${camera.scale}`
  } as CSSProperties;
  const cameraStyle = {
    transform: `translate(${camera.offsetX}px, ${camera.offsetY}px) scale(${camera.scale})`
  } as CSSProperties;

  const fitToBoard = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || typeof window === 'undefined') {
      return;
    }

    const rootFontSize = Number.parseFloat(
      window.getComputedStyle(document.documentElement).fontSize
    );
    const tileSizePx = TILE_SIZE_REM * (Number.isFinite(rootFontSize) ? rootFontSize : 16);
    const boardWidthPx = Math.max(1, metrics.columns * tileSizePx);
    const boardHeightPx = Math.max(1, metrics.rows * tileSizePx);
    const availableWidth = Math.max(1, shell.clientWidth - FIT_PADDING_PX * 2);
    const availableHeight = Math.max(1, shell.clientHeight - FIT_PADDING_PX * 2);
    const fitScale = clamp(
      Math.min(availableWidth / boardWidthPx, availableHeight / boardHeightPx, 1),
      MIN_ZOOM,
      MAX_ZOOM
    );
    setCamera({ scale: fitScale, offsetX: 0, offsetY: 0 });
  }, [metrics.columns, metrics.rows]);

  useEffect(() => {
    if (!hasFittedRef.current) {
      fitToBoard();
      hasFittedRef.current = true;
      return;
    }

    if (autoZoomOnNewTile) {
      fitToBoard();
    }
  }, [autoZoomOnNewTile, fitToBoard, boardShapeKey]);

  useEffect(() => {
    window.addEventListener('resize', fitToBoard);
    return () => window.removeEventListener('resize', fitToBoard);
  }, [fitToBoard]);

  useEffect(() => {
    const handleDocumentPointerDown = (event: globalThis.PointerEvent) => {
      const shell = shellRef.current;
      if (!shell || shell.contains(event.target as Node)) {
        return;
      }
      setFocused(false);
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    return () => document.removeEventListener('pointerdown', handleDocumentPointerDown);
  }, []);

  const zoomAtClientPoint = useCallback((factor: number, clientX: number, clientY: number) => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const rect = shell.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;

    setCamera((previous) => {
      const nextScale = clamp(previous.scale * factor, MIN_ZOOM, MAX_ZOOM);
      const worldX = (pointerX - centerX - previous.offsetX) / previous.scale;
      const worldY = (pointerY - centerY - previous.offsetY) / previous.scale;

      return {
        scale: nextScale,
        offsetX: pointerX - centerX - worldX * nextScale,
        offsetY: pointerY - centerY - worldY * nextScale
      };
    });
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!isFocused) {
        return;
      }

      event.preventDefault();
      zoomAtClientPoint(event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, event.clientX, event.clientY);
    };

    shell.addEventListener('wheel', handleWheel, { passive: false });
    return () => shell.removeEventListener('wheel', handleWheel);
  }, [isFocused, zoomAtClientPoint]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setFocused(true);

    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: camera.offsetX,
      startOffsetY: camera.offsetY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    setCamera((previous) => ({
      ...previous,
      offsetX: drag.startOffsetX + (event.clientX - drag.startX),
      offsetY: drag.startOffsetY + (event.clientY - drag.startY)
    }));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleZoomButton = (factor: number) => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const rect = shell.getBoundingClientRect();
    zoomAtClientPoint(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  return (
    <div
      ref={shellRef}
      className={`board-shell${isDragging ? ' board-shell--dragging' : ''}${
        isFocused ? ' board-shell--focused' : ''
      }`}
      style={boardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="board-grid" aria-hidden="true" />
      <div className="board-camera">
        <div className="board-tiles" role="grid" aria-label="Carcassonne board" style={cameraStyle}>
          {Object.entries(board.tiles).map(([key, tile]) => {
            const grid = toGridPosition(tile.position, bounds);
            const source = TILE_SOURCES[tile.tileId];
            const sprite = source ? getSpriteOffset(source, TILE_SIZE_REM) : null;
            const sheet = source ? TILE_SHEETS[source.sheet] ?? BASE_SHEET : BASE_SHEET;
            const tileStyle = {
              gridColumn: grid.column,
              gridRow: grid.row,
              transform: `rotate(${tile.orientation}deg)`,
              '--tile-offset-x': sprite ? `${sprite.xRem}rem` : '0rem',
              '--tile-offset-y': sprite ? `${sprite.yRem}rem` : '0rem',
              '--tile-sheet': source
                ? `url("${TILE_SHEET_URLS[source.sheet] ?? TILE_SHEET_URLS['tiles.png']}")`
                : 'none',
              '--sheet-width': `${sheet.columns * TILE_SIZE_REM}rem`,
              '--sheet-height': `${sheet.rows * TILE_SIZE_REM}rem`
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
              '--tile-sheet': placementSource
                ? `url("${TILE_SHEET_URLS[placementSource.sheet] ?? TILE_SHEET_URLS['tiles.png']}")`
                : 'none',
              '--sheet-width': `${placementSheet.columns * TILE_SIZE_REM}rem`,
              '--sheet-height': `${placementSheet.rows * TILE_SIZE_REM}rem`
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
            const spriteSet =
              meeple.kind === 'big'
                ? bigMeepleSprites
                : meeple.kind === 'abbot'
                  ? abbotMeepleSprites
                  : normalMeepleSprites;
            const sprite = spriteSet[color];
            const markerStyle = {
              gridColumn: grid.column,
              gridRow: grid.row,
              '--meeple-x': `${anchor.xPercent}%`,
              '--meeple-y': `${anchor.yPercent}%`
            } as CSSProperties;
            const role = getMeepleRoleLabel(meeple.featureType, meeple.kind);

            return (
              <div
                key={`${meeple.playerId}-${meeple.tilePosition.x}-${meeple.tilePosition.y}-${meeple.featureType}-${meeple.featureIndex}-${index}`}
                className={`board-meeple board-meeple--${color}`}
                style={markerStyle}
                aria-label={`${role} on ${meeple.featureType}`}
              >
                <span
                  className={`board-meeple__token${sprite ? '' : ' board-meeple__token--fallback'}`}
                  style={
                    sprite
                      ? ({ '--meeple-token-url': `url("${sprite}")` } as CSSProperties)
                      : undefined
                  }
                  aria-hidden="true"
                />
                <span className="board-meeple__role">{role}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="board-zoom-controls">
        <button
          type="button"
          className="board-ghost-button"
          onClick={() => handleZoomButton(ZOOM_STEP)}
          aria-label="Zoom in board"
        >
          +
        </button>
        <button
          type="button"
          className="board-ghost-button"
          onClick={() => handleZoomButton(1 / ZOOM_STEP)}
          aria-label="Zoom out board"
        >
          -
        </button>
        <button
          type="button"
          className="board-ghost-button board-ghost-button--label"
          onClick={fitToBoard}
        >
          fit
        </button>
      </div>
      {onOpenRules ? (
        <button
          type="button"
          className="rules-help-button"
          aria-label="Open game rules"
          onClick={onOpenRules}
        >
          ?
        </button>
      ) : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
