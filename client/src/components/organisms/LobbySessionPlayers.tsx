/**
 * @description Renders lobby session player rows with AI controls.
 */
import { useEffect, useState } from 'react';
import type { PlayerColor, SessionPlayerSummary } from '@carcassonne/shared';

const LOBBY_PLAYER_COLORS: PlayerColor[] = ['black', 'red', 'yellow', 'green', 'blue', 'gray', 'pink'];

interface LobbySessionPlayersProps {
  sessionId: string;
  players: SessionPlayerSummary[];
  canRemoveAiPlayer: boolean;
  canEditPlayerColors: boolean;
  onRemoveAiPlayer: (sessionId: string, aiPlayerId: string) => void;
  onSetSessionPlayerColor: (
    sessionId: string,
    color: PlayerColor,
    targetPlayerId?: string
  ) => void;
}

export function LobbySessionPlayers({
  sessionId,
  players,
  canRemoveAiPlayer,
  canEditPlayerColors,
  onRemoveAiPlayer,
  onSetSessionPlayerColor
}: LobbySessionPlayersProps) {
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  const usedColors = new Set(players.map((player) => player.color));

  useEffect(() => {
    setOpenPickerIndex(null);
  }, [sessionId, players]);

  return (
    <ul className="session-players-list">
      {players.length === 0 ? (
        <li className="session-players-empty">No players joined yet.</li>
      ) : (
        players.map((player, playerIndex) => {
          const aiPlayerId = player.aiPlayerId;
          const canEditColor =
            canEditPlayerColors && (!!player.isYou || (Boolean(player.isAi) && Boolean(aiPlayerId)));
          const colorTargetPlayerId = player.isAi ? aiPlayerId : undefined;
          const isPickerOpen = openPickerIndex === playerIndex;
          const selectableColors = LOBBY_PLAYER_COLORS.filter(
            (color) => color === player.color || !usedColors.has(color)
          );

          return (
            <li key={`${sessionId}-player-${playerIndex}`} className="session-player-item">
              <div className="session-player-main">
                {canEditColor ? (
                  <div className="session-player-color-control">
                    <button
                      type="button"
                      className="session-player-color-button"
                      onClick={() => setOpenPickerIndex((current) => (current === playerIndex ? null : playerIndex))}
                      aria-label={`Change ${player.name}'s player color`}
                      aria-expanded={isPickerOpen}
                    >
                      <span className={`hud-chip hud-chip--${player.color}`} aria-hidden="true" />
                    </button>
                    {isPickerOpen ? (
                      <div className="session-player-color-picker" role="group" aria-label="Available player colors">
                        {selectableColors.map((color) => (
                          <button
                            key={`${sessionId}-${playerIndex}-${color}`}
                            type="button"
                            className={`session-player-color-option${color === player.color ? ' is-active' : ''}`}
                            aria-label={`Set color ${color}`}
                            onClick={() => {
                              onSetSessionPlayerColor(sessionId, color, colorTargetPlayerId);
                              setOpenPickerIndex(null);
                            }}
                          >
                            <span className={`hud-chip hud-chip--${color}`} aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <span className={`hud-chip hud-chip--${player.color}`} aria-hidden="true" />
                )}
                <span className={`players-name player-name-color player-name-color--${player.color}`}>
                  {player.name}
                </span>
                {player.isYou ? <span className="session-player-self">(You)</span> : null}
                {player.isAi ? <span className="session-player-self">(bot)</span> : null}
              </div>
              <div className="session-player-meta">
                {player.isAi && aiPlayerId && canRemoveAiPlayer ? (
                  <button
                    type="button"
                    className="session-remove-ai"
                    onClick={() => onRemoveAiPlayer(sessionId, aiPlayerId)}
                    aria-label={`Remove ${player.name}`}
                  >
                    X
                  </button>
                ) : null}
              </div>
            </li>
          );
        })
      )}
    </ul>
  );
}
