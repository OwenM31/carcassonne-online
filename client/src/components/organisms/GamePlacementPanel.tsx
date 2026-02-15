/**
 * @description Turn controls for draw/rotate/undo and current tile preview.
 */
import type { Orientation, TileId } from '@carcassonne/shared';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { TileSprite } from '../atoms/TileSprite';
import { MeepleActions } from './MeepleActions';

const PLACEMENT_TILE_SIZE_REM = 5.5;

interface GamePlacementPanelProps {
  isActivePlayer: boolean;
  statusText: string;
  canDrawTile: boolean;
  isSandbox: boolean;
  canPlaceTile: boolean;
  orientation: Orientation;
  canPlaceMeeple: boolean;
  canUndo: boolean;
  currentTileId: TileId | null;
  error?: string | null;
  onDrawTile: () => void;
  onUndo: () => void;
  onRotate: (step: number) => void;
  onSkipMeeple: () => void;
}

export function GamePlacementPanel({
  isActivePlayer,
  statusText,
  canDrawTile,
  isSandbox,
  canPlaceTile,
  orientation,
  canPlaceMeeple,
  canUndo,
  currentTileId,
  error,
  onDrawTile,
  onUndo,
  onRotate,
  onSkipMeeple
}: GamePlacementPanelProps) {
  return (
    <div className="placement-panel">
      <div className="placement-status">
        <Badge tone={isActivePlayer ? 'positive' : 'neutral'}>
          {isActivePlayer ? 'Your turn' : 'Waiting'}
        </Badge>
        <p className="hint">{statusText}</p>
      </div>
      <div className="placement-actions">
        <Button type="button" variant="primary" disabled={!canDrawTile} onClick={onDrawTile}>
          {isSandbox ? 'Draw selected tile' : 'Draw tile'}
        </Button>
        <Button type="button" variant="ghost" disabled={!canUndo} onClick={onUndo}>
          Undo
        </Button>
        <div className="rotation-controls">
          <Button type="button" variant="ghost" disabled={!canPlaceTile} onClick={() => onRotate(-1)}>
            Rotate left
          </Button>
          <span className="rotation-value">{orientation}°</span>
          <Button type="button" variant="ghost" disabled={!canPlaceTile} onClick={() => onRotate(1)}>
            Rotate right
          </Button>
        </div>
        <MeepleActions disabled={!canPlaceMeeple} onSkipMeeple={onSkipMeeple} />
      </div>
      <div className="placement-tile-slot">
        {currentTileId ? (
          <TileSprite tileId={currentTileId} sizeRem={PLACEMENT_TILE_SIZE_REM} orientation={orientation} />
        ) : (
          <p className="hud-tile-placeholder">No tile drawn.</p>
        )}
        <p className="hud-tile-id">{currentTileId ?? '—'}</p>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
