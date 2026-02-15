/**
 * @description Right-side controls for draw/rotate/meeple actions and tile preview.
 */
import type { Orientation, TileId } from '@carcassonne/shared';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { TileSprite } from '../atoms/TileSprite';

const PLACEMENT_TILE_SIZE_REM = 4.6;

interface GamePlacementPanelProps {
  isActivePlayer: boolean;
  statusText: string;
  canDrawTile: boolean;
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
    <aside className="board-turn-panel">
      <div className="board-turn-panel__status">
        <Badge tone={isActivePlayer ? 'positive' : 'neutral'}>
          {isActivePlayer ? 'Your turn' : 'Waiting'}
        </Badge>
        <p className="hint">{statusText}</p>
      </div>
      <div className="board-turn-panel__tile">
        {currentTileId ? (
          <TileSprite tileId={currentTileId} sizeRem={PLACEMENT_TILE_SIZE_REM} orientation={orientation} />
        ) : (
          <p className="hud-tile-placeholder">No tile drawn.</p>
        )}
        <p className="hud-tile-id">{currentTileId ?? '—'}</p>
      </div>
      <div className="board-turn-panel__row">
        <Button type="button" variant="primary" disabled={!canDrawTile} onClick={onDrawTile}>
          Draw tile
        </Button>
        <Button type="button" variant="ghost" disabled={!canUndo} onClick={onUndo}>
          Undo
        </Button>
      </div>
      <div className="board-turn-panel__row">
        <Button type="button" variant="ghost" disabled={!canPlaceTile} onClick={() => onRotate(-1)}>
          Rotate left
        </Button>
        <Button type="button" variant="ghost" disabled={!canPlaceTile} onClick={() => onRotate(1)}>
          Rotate right
        </Button>
      </div>
      <Button type="button" variant="ghost" disabled={!canPlaceMeeple} onClick={onSkipMeeple}>
        Skip meeple
      </Button>
      {error ? <p className="error">{error}</p> : null}
    </aside>
  );
}
