/**
 * @description Controls for optional meeple placement after tile placement.
 */
import { Button } from '../atoms/Button';

interface MeepleActionsProps {
  disabled: boolean;
  onSkipMeeple: () => void;
}
export function MeepleActions({ disabled, onSkipMeeple }: MeepleActionsProps) {
  return (
    <div className="meeple-panel">
      <p className="hint">Click a highlighted meeple spot on the board to place one.</p>
      <Button type="button" variant="ghost" disabled={disabled} onClick={onSkipMeeple}>
        Skip meeple
      </Button>
    </div>
  );
}
