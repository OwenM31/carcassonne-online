/**
 * @description Right-side HUD for game status, scoreboard, feature counters, and event log.
 */
import type { GameHudState } from '../../state/gameHud';
import { TileSprite } from '../atoms/TileSprite';

const HUD_TILE_SIZE_REM = 7;

interface GameHudProps {
  hud: GameHudState;
}

const labelForFeature = (featureType: string) => {
  if (featureType === 'farm') {
    return 'Grassland';
  }

  return featureType.charAt(0).toUpperCase() + featureType.slice(1);
};

export function GameHud({ hud }: GameHudProps) {
  const activePlayer = hud.activePlayer;
  const chipClass = activePlayer ? `hud-chip--${activePlayer.color}` : 'hud-chip--neutral';
  const tileId = hud.currentTileId;
  const playerColorById = hud.scoreboard.reduce<Record<string, string>>((index, player) => {
    index[player.id] = player.color;
    return index;
  }, {});

  return (
    <aside className="card game-hud">
      <h2 className="card__title">Match HUD</h2>

      <div className="hud-section">
        <p className="hud-label">Active player</p>
        <div className="hud-value">
          <span className={`hud-chip ${chipClass}`} aria-hidden="true" />
          <span>{activePlayer?.name ?? 'Unknown'}</span>
        </div>
      </div>

      <div className="hud-section">
        <p className="hud-label">Phase</p>
        <p className="hud-value">{hud.phaseLabel}</p>
      </div>

      <div className="hud-section">
        <p className="hud-label">Deck</p>
        <p className="hud-value">{hud.deckCount} tiles</p>
      </div>

      <div className="hud-section">
        <p className="hud-label">Current tile</p>
        <div className="hud-tile-slot">
          {tileId ? (
            <TileSprite tileId={tileId} sizeRem={HUD_TILE_SIZE_REM} />
          ) : (
            <p className="hud-tile-placeholder">No tile drawn yet.</p>
          )}
          <p className="hud-tile-id">{tileId ?? '—'}</p>
        </div>
      </div>

      <div className="hud-section">
        <p className="hud-label">Scoreboard</p>
        <ul className="hud-list">
          {hud.scoreboard.map((entry) => (
            <li key={entry.id} className={`hud-item${entry.isActive ? ' hud-item--active' : ''}`}>
              <span className="hud-item__name">
                <span className={`hud-chip hud-chip--${entry.color}`} aria-hidden="true" />
                {entry.name}
              </span>
              <span className="hud-item__meta">
                Meeples {entry.meeplesAvailable}/{entry.meeplesTotal} · Score {entry.score}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hud-section">
        <p className="hud-label">Feature counter</p>
        <ul className="hud-list hud-list--tight">
          <li className="hud-item">
            <span className="hud-item__name">{labelForFeature('city')}</span>
            <span className="hud-item__meta">
              {hud.featureCounter.cities.closed} closed / {hud.featureCounter.cities.open} open
            </span>
          </li>
          <li className="hud-item">
            <span className="hud-item__name">{labelForFeature('road')}</span>
            <span className="hud-item__meta">
              {hud.featureCounter.roads.closed} closed / {hud.featureCounter.roads.open} open
            </span>
          </li>
          <li className="hud-item">
            <span className="hud-item__name">{labelForFeature('monastery')}</span>
            <span className="hud-item__meta">{hud.featureCounter.monasteries}</span>
          </li>
          <li className="hud-item">
            <span className="hud-item__name">{labelForFeature('farm')}</span>
            <span className="hud-item__meta">{hud.featureCounter.grasslands}</span>
          </li>
        </ul>
      </div>

      <div className="hud-section">
        <p className="hud-label">Event log</p>
        <ul className="hud-events">
          {hud.eventLog.map((entry, index) => (
            <li
              key={`${entry.turn}-${entry.type}-${index}`}
              className={`hud-event ${
                entry.playerId ? `hud-event--${playerColorById[entry.playerId] ?? 'neutral'}` : 'hud-event--neutral'
              }`}
            >
              <span className="hud-event__text">{entry.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
