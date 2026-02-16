/**
 * @description Read-only replay controls for stepping through completed turns.
 */
import { Button } from '../atoms/Button';

interface GameReplayHotbarProps {
  replayTurn: number | null;
  autoJumpOnLiveUpdate: boolean;
  autoZoomOnNewTile: boolean;
  canStepBackward: boolean;
  canJumpCurrent: boolean;
  canStepForward: boolean;
  showSandboxReset: boolean;
  canResetSandbox: boolean;
  onToggleAutoJumpOnLiveUpdate: (enabled: boolean) => void;
  onToggleAutoZoomOnNewTile: (enabled: boolean) => void;
  onStepBackward: () => void;
  onJumpCurrent: () => void;
  onStepForward: () => void;
  onResetSandbox: () => void;
}

export function GameReplayHotbar({
  replayTurn,
  autoJumpOnLiveUpdate,
  autoZoomOnNewTile,
  canStepBackward,
  canJumpCurrent,
  canStepForward,
  showSandboxReset,
  canResetSandbox,
  onToggleAutoJumpOnLiveUpdate,
  onToggleAutoZoomOnNewTile,
  onStepBackward,
  onJumpCurrent,
  onStepForward,
  onResetSandbox
}: GameReplayHotbarProps) {
  return (
    <div className="replay-hotbar">
      <p className="replay-hotbar__label">
        {replayTurn === null ? 'Viewing current board' : `Viewing after turn ${replayTurn}`}
      </p>
      <div className="replay-hotbar__actions">
        <Button type="button" variant="ghost" disabled={!canStepBackward} onClick={onStepBackward}>
          backward
        </Button>
        <Button type="button" variant="ghost" disabled={!canJumpCurrent} onClick={onJumpCurrent}>
          jump to current
        </Button>
        <Button type="button" variant="ghost" disabled={!canStepForward} onClick={onStepForward}>
          forward
        </Button>
        {showSandboxReset ? (
          <Button type="button" variant="primary" disabled={!canResetSandbox} onClick={onResetSandbox}>
            reset board
          </Button>
        ) : null}
      </div>
      <label className="replay-hotbar__toggle">
        <input
          type="checkbox"
          checked={autoJumpOnLiveUpdate}
          onChange={(event) => onToggleAutoJumpOnLiveUpdate(event.target.checked)}
        />
        auto-jump to current on live update
      </label>
      <label className="replay-hotbar__toggle">
        <input
          type="checkbox"
          checked={autoZoomOnNewTile}
          onChange={(event) => onToggleAutoZoomOnNewTile(event.target.checked)}
        />
        auto-zoom on new tile
      </label>
    </div>
  );
}
