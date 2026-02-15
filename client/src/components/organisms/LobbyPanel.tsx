/**
 * @description Lobby screen layout with session selection and controls.
 */
import type { CSSProperties } from 'react';
import type {
  SessionAiProfile,
  SessionDeckSize,
  SessionMode,
  SessionSummary,
  SessionTurnTimer
} from '@carcassonne/shared';

import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { TextField } from '../atoms/TextField';

interface LobbyPanelProps {
  playerName: string;
  onNameChange: (value: string) => void;
  playerPin: string;
  onPinChange: (value: string) => void;
  onCreateSession: () => void;
  onJoinSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onSetSessionDeckSize: (sessionId: string, deckSize: SessionDeckSize) => void;
  onSetSessionMode: (sessionId: string, mode: SessionMode) => void;
  onSetSessionTurnTimer: (sessionId: string, turnTimerSeconds: SessionTurnTimer) => void;
  onAddAiPlayer: (sessionId: string, aiProfile: SessionAiProfile) => void;
  onLeaveSession: () => void;
  onStartGame: () => void;
  isConnected: boolean;
  canStartGame: boolean;
  minimumPlayersToStart: number;
  sessions: SessionSummary[];
  activeSessionId: string | null;
  error: string | null;
}

export function LobbyPanel({
  playerName,
  onNameChange,
  playerPin,
  onPinChange,
  onCreateSession,
  onJoinSession,
  onDeleteSession,
  onSetSessionDeckSize,
  onSetSessionMode,
  onSetSessionTurnTimer,
  onAddAiPlayer,
  onLeaveSession,
  onStartGame,
  isConnected,
  canStartGame,
  minimumPlayersToStart,
  sessions,
  activeSessionId,
  error
}: LobbyPanelProps) {
  const canLeaveSession = !!activeSessionId;
  const isNameLocked = !!activeSessionId;

  return (
    <main className="page">
      <header className="lobby-header">
        <h1 className="lobby-header__title">Carcassonne Online</h1>
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
            <TextField
              label="PIN (optional)"
              value={playerPin}
              placeholder="Set PIN for reconnects"
              type="password"
              inputMode="numeric"
              maxLength={12}
              onChange={onPinChange}
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
              <p className="hint">Waiting for at least {minimumPlayersToStart} player(s) to start.</p>
            ) : null}
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
                  const canChangeDeckSize = isConnected && !isInProgress;
                  const canChangeMode = isConnected && !isInProgress;
                  const canChangeTurnTimer = isConnected && !isInProgress;
                  const canAddAiPlayer = isConnected && !isInProgress && session.playerCount < 5;
                  const statusLabel = isInProgress ? 'In progress' : 'Lobby';
                  const nextDeckSize: SessionDeckSize =
                    session.deckSize === 'small' ? 'standard' : 'small';
                  const deckLabel = session.deckSize === 'small' ? 'Small deck' : 'Standard deck';
                  const nextMode: SessionMode =
                    session.mode === 'sandbox' ? 'standard' : 'sandbox';
                  const modeLabel = session.mode === 'sandbox' ? 'Sandbox mode' : 'Standard mode';
                  const nextTurnTimer: SessionTurnTimer =
                    session.turnTimerSeconds === 30
                      ? 60
                      : session.turnTimerSeconds === 60
                        ? 90
                        : session.turnTimerSeconds === 90
                          ? 0
                        : 30;

                  return (
                    <li
                      key={session.id}
                      className="session-item"
                      style={{ '--stagger': `${index * 0.08}s` } as CSSProperties}
                    >
                      <div className="session-info">
                        <span className="session-id">{session.id}</span>
                        <span className="session-meta">
                          {statusLabel} · {session.playerCount} players · {deckLabel} · {modeLabel} · Timer {formatTurnTimer(session.turnTimerSeconds)}
                        </span>
                        <ul className="session-players-list">
                          {session.players.length === 0 ? (
                            <li className="session-players-empty">No players joined yet.</li>
                          ) : (
                            session.players.map((player, playerIndex) => (
                              <li
                                key={`${session.id}-player-${playerIndex}`}
                                className="session-player-item"
                              >
                                <span className="players-name">{player.name}</span>
                                {player.isAi ? <span className="players-id">AI</span> : null}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div className="session-actions">
                        <Badge tone={isInProgress ? 'warning' : 'neutral'}>{statusLabel}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={!canChangeDeckSize}
                          onClick={() => onSetSessionDeckSize(session.id, nextDeckSize)}
                        >
                          {session.deckSize === 'small' ? 'Use standard deck' : 'Use small deck'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={!canChangeMode}
                          onClick={() => onSetSessionMode(session.id, nextMode)}
                        >
                          {session.mode === 'sandbox' ? 'Use standard mode' : 'Use sandbox mode'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={!canAddAiPlayer}
                          onClick={() => onAddAiPlayer(session.id, 'randy')}
                        >
                          Add RANDY
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={!canChangeTurnTimer}
                          onClick={() => onSetSessionTurnTimer(session.id, nextTurnTimer)}
                        >
                          Timer {formatTurnTimer(session.turnTimerSeconds)}
                        </Button>
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
      </section>
    </main>
  );
}

function formatTurnTimer(turnTimerSeconds: SessionTurnTimer): string {
  return turnTimerSeconds === 0 ? 'Unlimited' : `${turnTimerSeconds}s`;
}
