/**
 * @description Lobby screen layout with session selection and controls.
 */
import type {
  PlayerColor,
  SessionAddon,
  SessionAiProfile,
  SessionDeckSize,
  SessionMode,
  SessionSummary,
  SessionTurnTimer
} from '@carcassonne/shared';

import { Button } from '../atoms/Button';
import { TextField } from '../atoms/TextField';
import { LobbySessionCard } from './LobbySessionCard';

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
  onSetSessionAddons: (sessionId: string, addons: SessionAddon[]) => void;
  onSetSessionTurnTimer: (sessionId: string, turnTimerSeconds: SessionTurnTimer) => void;
  onSetSessionPlayerColor: (
    sessionId: string,
    color: PlayerColor,
    targetPlayerId?: string
  ) => void;
  onAddAiPlayer: (sessionId: string, aiProfile: SessionAiProfile) => void;
  onRemoveAiPlayer: (sessionId: string, aiPlayerId: string) => void;
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
  onSetSessionAddons,
  onSetSessionTurnTimer,
  onSetSessionPlayerColor,
  onAddAiPlayer,
  onRemoveAiPlayer,
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

                  return (
                    <LobbySessionCard
                      key={session.id}
                      index={index}
                      session={session}
                      isConnected={isConnected}
                      isActive={isActive}
                      hasActiveSession={!!activeSessionId}
                      canStartGame={canStartGame}
                      minimumPlayersToStart={minimumPlayersToStart}
                      onJoinSession={onJoinSession}
                      onLeaveSession={onLeaveSession}
                      onStartGame={onStartGame}
                      onDeleteSession={onDeleteSession}
                      onSetSessionDeckSize={onSetSessionDeckSize}
                      onSetSessionMode={onSetSessionMode}
                      onSetSessionAddons={onSetSessionAddons}
                      onSetSessionTurnTimer={onSetSessionTurnTimer}
                      onSetSessionPlayerColor={onSetSessionPlayerColor}
                      onAddAiPlayer={onAddAiPlayer}
                      onRemoveAiPlayer={onRemoveAiPlayer}
                    />
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
