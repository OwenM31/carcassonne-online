/**
 * @description In-game rules modal with separated base and add-on rule sets.
 */
import { useEffect } from 'react';
import type { SessionAddon } from '@carcassonne/shared';

interface GameRulesModalProps {
  open: boolean;
  onClose: () => void;
  addons: SessionAddon[];
}

const BASE_RULES = [
  'Tile edges must match neighboring edges (city to city, road to road, grassland to grassland).',
  'When a feature closes, players with majority meeples score for that feature.',
  'Meeples placed on scored city/road/monastery features return to the owning player.',
  'Turn timer expiry auto-places the current tile and skips meeple placement.',
  'At game end, incomplete features and farms are scored in final scoring.'
] as const;

const INNS_AND_CATHEDRALS_RULES = [
  'This add-on adds 18 extra tiles to the deck.',
  'Each player gets one big meeple. It counts as two meeples for majority.',
  'A completed road with an inn scores 2 points per tile.',
  'A completed city with a cathedral scores 3 points per tile and pennant.',
  'An incomplete road with an inn scores 0 points in final scoring.',
  'An incomplete city with a cathedral scores 0 points in final scoring.'
] as const;

const RIVER_RULES = [
  'River adds 12 opening tiles to the match.',
  'The spring tile is placed first and the lake tile is placed last.',
  'During river setup, tiles must extend from an open river end.',
  'No immediate river u-turns are allowed (same-direction bends in a row).'
] as const;

const RIVER_2_RULES = [
  'River 2 adds 12 opening tiles to the match.',
  'River source is placed first, the fork tile is placed second.',
  'During river setup, tiles must extend from an open river end.',
  'No immediate river u-turns are allowed (same-direction bends in a row).',
  'The final two river tiles are the city-end and volcano-end in random order.'
] as const;

const ABBOT_RULES = [
  'This add-on adds 8 garden tiles to the deck.',
  'Each player gets one abbot.',
  'The abbot can be placed on a monastery or garden.',
  'During meeple phase, you may return your abbot instead of placing a meeple.',
  'Returned abbot scores 1 point per surrounding tile plus its own tile.'
] as const;

export function GameRulesModal({ open, onClose, addons }: GameRulesModalProps) {
  const hasInnsAndCathedrals = addons.includes('inns_and_cathedrals');
  const hasRiver = addons.includes('river');
  const hasRiver2 = addons.includes('river_2');
  const hasAbbot = addons.includes('abbot');

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
        <div className="rules-modal__sections">
          <section className="rules-modal__section">
            <h3 className="rules-modal__section-title">Base Game</h3>
            <ul className="rules-modal__list">
              {BASE_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
          {hasInnsAndCathedrals ? (
            <section className="rules-modal__section rules-modal__section--addon">
              <h3 className="rules-modal__section-title">Add-on: Inns and Cathedrals</h3>
              <ul className="rules-modal__list">
                {INNS_AND_CATHEDRALS_RULES.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {hasRiver ? (
            <section className="rules-modal__section rules-modal__section--addon">
              <h3 className="rules-modal__section-title">Add-on: River</h3>
              <ul className="rules-modal__list">
                {RIVER_RULES.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
                {hasRiver2 ? <li>With River 2 enabled, River spring/lake tiles are removed.</li> : null}
              </ul>
            </section>
          ) : null}
          {hasRiver2 ? (
            <section className="rules-modal__section rules-modal__section--addon">
              <h3 className="rules-modal__section-title">Add-on: River 2</h3>
              <ul className="rules-modal__list">
                {RIVER_2_RULES.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {hasAbbot ? (
            <section className="rules-modal__section rules-modal__section--addon">
              <h3 className="rules-modal__section-title">Add-on: Abbot</h3>
              <ul className="rules-modal__list">
                {ABBOT_RULES.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
