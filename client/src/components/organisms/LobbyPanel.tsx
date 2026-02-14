/**
 * @description Lobby screen layout with session selection and controls.
 */
import type { CSSProperties } from 'react';
import type { LobbyPlayer, SessionSummary } from '@carcassonne/shared';

import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { TextField } from '../atoms/TextField';

interface LobbyPanelProps {
  playerName: string;
  onNameChange: (value: string) => void;
  onCreateSession: () => void;
  onJoinSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onLeaveSession: () => void;
  onStartGame: () => void;
  isConnected: boolean;
  canStartGame: boolean;
  players: LobbyPlayer[];
  sessions: SessionSummary[];
  activeSessionId: string | null;
  error: string | null;
  serverUrl: string;
}

export function LobbyPanel({
  playerName,
  onNameChange,
  onCreateSession,
  onJoinSession,
  onDeleteSession,
  onLeaveSession,
  onStartGame,
  isConnected,
  canStartGame,
  players,
  sessions,
  activeSessionId,
  error,
  serverUrl
}: LobbyPanelProps) {
  const badgeTone = isConnected ? 'positive' : 'warning';
  const canLeaveSession = !!activeSessionId;
  const isNameLocked = !!activeSessionId;

  return (
    <main className="page">
      <header className="hero">
        <div className="hero__copy">
          <p className="hero__kicker">Carcassonne Online</p>
          <h1 className="hero__title">Lay tiles, claim roads, grow cities.</h1>
          <p className="hero__subtitle">
            Spin up a lobby, invite friends, and pull the countryside together.
          </p>
        </div>
        <Badge tone={badgeTone}>{isConnected ? 'Connected' : 'Offline'}</Badge>
      </header>

      <section className="card lobby-card">
        <div className="lobby-grid">
          <div className="lobby-controls">
            <h2 className="card__title">Player profile</h2>
            <TextField
              label="Player name"
              value={playerName}
              placeholder="Enter your name"
              onChange={onNameChange}
              disabled={isNameLocked}
            />
            <div className="button-row">
              <Button type="button" variant="primary" disabled={!isConnected} onClick={onCreateSession}>
                Create session
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!canLeaveSession}
                onClick={onLeaveSession}
              >
                Leave session
              </Button>
            </div>
            <div className="button-row">
              <Button type="button" variant="primary" disabled={!canStartGame} onClick={onStartGame}>
                Start game
              </Button>
            </div>
            {activeSessionId && !canStartGame ? (
              <p className="hint">Waiting for at least 2 players to start.</p>
            ) : null}
            <div className="meta">
              <span className="meta__label">Server</span>
              <span className="meta__value">{serverUrl}</span>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </div>

          <div className="lobby-sessions">
            <div className="players-header">
              <h2 className="card__title">Sessions</h2>
              <span className="players-count">{sessions.length} listed</span>
            </div>
            <ul className="sessions-list">
              {sessions.length === 0 ? (
                <li className="sessions-empty">No sessions yet. Create one to start.</li>
              ) : (
                sessions.map((session, index) => {
                  const isActive = session.id === activeSessionId;
                  const isInProgress = session.status === 'in_progress';
                  const canJoin = isConnected && !activeSessionId;
                  const canDelete = isConnected && !activeSessionId;
                  const statusLabel = isInProgress ? 'In progress' : 'Lobby';

                  return (
                    <li
                      key={session.id}
                      className="session-item"
                      style={{ '--stagger': `${index * 0.08}s` } as CSSProperties}
                    >
                      <div className="session-info">
                        <span className="session-id">{session.id}</span>
                        <span className="session-meta">
                          {statusLabel} · {session.playerCount} players
                        </span>
                      </div>
                      <div className="session-actions">
                        <Badge tone={isInProgress ? 'warning' : 'neutral'}>{statusLabel}</Badge>
                        <Button
                          type="button"
                          variant="primary"
                          disabled={!canJoin}
                          onClick={() => onJoinSession(session.id)}
                        >
                          {isActive ? 'Connected' : 'Connect'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={!canDelete}
                          onClick={() => onDeleteSession(session.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
        <div className="lobby-players">
          <div className="players-header">
            <h2 className="card__title">Players</h2>
            <span className="players-count">{players.length} joined</span>
          </div>
          <ul className="players-list">
            {players.length === 0 ? (
              <li className="players-empty">No one here yet. Be the first.</li>
            ) : (
              players.map((player, index) => (
                <li
                  key={player.id}
                  className="players-item"
                  style={{ '--stagger': `${index * 0.08}s` } as CSSProperties}
                >
                  <span className="players-name">{player.name}</span>
                  <span className="players-id">#{player.id.slice(0, 6)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
