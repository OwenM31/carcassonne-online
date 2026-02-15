/**
 * @description Match HUD for game status, scoreboard, feature counters, and event log.
 */
import type { GameEvent } from '@carcassonne/shared';
import type { GameHudState } from '../../state/gameHud';
import { groupEventsByTurn } from '../../state/gameEvents';

interface GameHudProps {
  hud: GameHudState;
  eventLog: GameEvent[];
  replayTurn: number | null;
  turnSecondsRemaining: number | null;
  turnTimerSeconds: number;
  onSelectEventGroup: (turn: number, isMostRecent: boolean) => void;
}

const labelForFeature = (featureType: string) => {
  if (featureType === 'farm') {
    return 'Grassland';
  }

  return featureType.charAt(0).toUpperCase() + featureType.slice(1);
};

const formatEventTime = (createdAt?: string): string => {
  if (!createdAt) {
    return '--:--:--';
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '--:--:--';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export function GameHud({
  hud,
  eventLog,
  replayTurn,
  turnSecondsRemaining,
  turnTimerSeconds,
  onSelectEventGroup
}: GameHudProps) {
  const activePlayer = hud.activePlayer;
  const chipClass = activePlayer ? `hud-chip--${activePlayer.color}` : 'hud-chip--neutral';
  const playerColorById = hud.scoreboard.reduce<Record<string, string>>((index, player) => {
    index[player.id] = player.color;
    return index;
  }, {});
  const eventGroups = groupEventsByTurn(eventLog);

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
        <p className="hud-label">Scoreboard</p>
        <ul className="hud-list">
          {hud.scoreboard.map((entry) => (
            <li key={entry.id} className={`hud-item${entry.isActive ? ' hud-item--active' : ''}`}>
              <div className="hud-item__header">
                <span className="hud-item__name">
                  <span className={`hud-chip hud-chip--${entry.color}`} aria-hidden="true" />
                  {entry.name}
                </span>
                {entry.isActive && turnSecondsRemaining !== null ? (
                  <span className="hud-turn-timer">
                    {turnSecondsRemaining}s/{turnTimerSeconds}s
                  </span>
                ) : null}
              </div>
              <span className="hud-item__meta">Meeples {entry.meeplesAvailable}/{entry.meeplesTotal} · Score {entry.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hud-section">
        <p className="hud-label">Feature counter</p>
        <ul className="hud-list hud-list--tight">
          <li className="hud-item">
            <span className="hud-item__name">{labelForFeature('city')}</span>
            <span className="hud-item__meta">{hud.featureCounter.cities.closed} closed / {hud.featureCounter.cities.open} open</span>
          </li>
          <li className="hud-item">
            <span className="hud-item__name">{labelForFeature('road')}</span>
            <span className="hud-item__meta">{hud.featureCounter.roads.closed} closed / {hud.featureCounter.roads.open} open</span>
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
          {eventGroups.map((group, index) => {
            const isMostRecent = index === 0;
            const isSelected = replayTurn !== null && replayTurn === group.turn;

            return (
              <li key={`turn-${group.turn}`} className="hud-event-group-item">
                <button
                  type="button"
                  className={`hud-event-group${isSelected ? ' hud-event-group--selected' : ''}`}
                  onClick={() => onSelectEventGroup(group.turn, isMostRecent)}
                >
                  {group.events.map((entry, eventIndex) => (
                    <span
                      key={`${entry.turn}-${entry.type}-${eventIndex}`}
                      className={`hud-event ${entry.playerId ? `hud-event--${playerColorById[entry.playerId] ?? 'neutral'}` : 'hud-event--neutral'}`}
                    >
                      <span className="hud-event__time">{formatEventTime(entry.createdAt)}</span>
                      <span className="hud-event__text">{entry.detail}</span>
                    </span>
                  ))}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
