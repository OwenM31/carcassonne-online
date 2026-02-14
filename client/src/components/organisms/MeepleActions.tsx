/**
 * @description Controls for optional meeple placement after tile placement.
 */
import type { MeeplePlacement } from '@carcassonne/shared';

import { Button } from '../atoms/Button';

interface MeepleActionsProps {
  options: MeeplePlacement[];
  disabled: boolean;
  onPlaceMeeple: (placement: MeeplePlacement) => void;
  onSkipMeeple: () => void;
}

const formatMeepleOptionLabel = (option: MeeplePlacement): string => {
  const name = option.featureType === 'farm' ? 'grassland' : option.featureType;
  return `${name} ${option.featureIndex + 1}`;
};

export function MeepleActions({
  options,
  disabled,
  onPlaceMeeple,
  onSkipMeeple
}: MeepleActionsProps) {
  return (
    <div className="meeple-panel">
      {options.map((option) => (
        <Button
          key={`${option.featureType}-${option.featureIndex}`}
          type="button"
          variant="ghost"
          disabled={disabled}
          onClick={() => onPlaceMeeple(option)}
        >
          Place on {formatMeepleOptionLabel(option)}
        </Button>
      ))}
      <Button type="button" variant="ghost" disabled={disabled} onClick={onSkipMeeple}>
        Skip meeple
      </Button>
    </div>
  );
}
