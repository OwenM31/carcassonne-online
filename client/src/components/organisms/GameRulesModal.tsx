/**
 * @description Lightweight in-game rules modal with base-turn flow guidance.
 */
import { useEffect } from 'react';

interface GameRulesModalProps {
  open: boolean;
  onClose: () => void;
}

export function GameRulesModal({ open, onClose }: GameRulesModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="rules-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="rules-modal card"
        role="dialog"
        aria-modal="true"
        aria-label="Carcassonne rules"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="rules-modal__header">
          <h2 className="card__title">How To Play</h2>
          <button
            type="button"
            className="rules-modal__close"
            onClick={onClose}
            aria-label="Close rules"
          >
            Close
          </button>
        </div>
        <p className="hint">
          Each turn: draw a tile, place it legally, then place or skip a meeple.
        </p>
        <ul className="rules-modal__list">
          <li>Tile edges must match neighboring edges (city to city, road to road, grassland to grassland).</li>
          <li>When a feature closes, players with majority meeples score for that feature.</li>
          <li>Meeples placed on scored city/road/monastery features return to the owning player.</li>
          <li>Turn timer expiry auto-places the current tile and skips meeple placement.</li>
          <li>At game end, incomplete features and farms are scored in final scoring.</li>
        </ul>
      </section>
    </div>
  );
}
