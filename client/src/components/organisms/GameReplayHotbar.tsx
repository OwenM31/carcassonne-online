/**
 * @description Read-only replay controls for stepping through completed turns.
 */
import { Button } from '../atoms/Button';

interface GameReplayHotbarProps {
  replayTurn: number | null;
  canStepBackward: boolean;
  canJumpCurrent: boolean;
  canStepForward: boolean;
  showSandboxReset: boolean;
  canResetSandbox: boolean;
  onStepBackward: () => void;
  onJumpCurrent: () => void;
  onStepForward: () => void;
  onResetSandbox: () => void;
}

export function GameReplayHotbar({
  replayTurn,
  canStepBackward,
  canJumpCurrent,
  canStepForward,
  showSandboxReset,
  canResetSandbox,
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
    </div>
  );
}
