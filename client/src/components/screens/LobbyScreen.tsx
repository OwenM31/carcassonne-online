/**
 * @description Handles lobby/session flow and routing into active games.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '@carcassonne/shared';
import { LobbyPanel } from '../organisms/LobbyPanel';
import { GameScreen } from './GameScreen';
import { LobbyClient } from '../../services/lobbyClient';
import { isPlayerInGame } from '../../state/gameSelectors';
import { applyLobbyMessage, initialLobbyViewState } from '../../state/lobbyState';
import { loadOrCreatePlayerId } from '../../state/playerIdentity';

const DEFAULT_SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'ws://localhost:3001';

export function LobbyScreen() {
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setConnected] = useState(false);
  const [viewState, setViewState] = useState(initialLobbyViewState);
  const [game, setGame] = useState<GameState | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSessionRef = useRef(activeSessionId);
  const [playerId] = useState(() => loadOrCreatePlayerId());
  const [serverUrl] = useState(DEFAULT_SERVER_URL);
  const client = useMemo(() => new LobbyClient(), []);
  const clearActiveSessionState = () => {
    setActiveSessionId(null);
    activeSessionRef.current = null;
    setGame(null);
    setGameError(null);
  };
  const withSession = (callback: (sessionId: string) => void) => {
    if (!activeSessionId) {
      return;
    }
    callback(activeSessionId);
  };

  useEffect(() => {
    activeSessionRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    client.connect(serverUrl, {
      onOpen: () => {
        setConnected(true);
        client.listSessions();
      },
      onClose: () => {
        setConnected(false);
      },
      onError: (message) => {
        setViewState((prev) => ({ ...prev, error: message }));
      },
      onMessage: (message) => {
        const currentSessionId = activeSessionRef.current;
        if (message.type === 'game_started' || message.type === 'game_state') {
          if (message.sessionId !== currentSessionId) {
            return;
          }
          if (!isPlayerInGame(message.game, playerId)) {
            clearActiveSessionState();
            setGameError('Game in progress.');
            return;
          }
          setGame(message.game);
          setGameError(null);
          return;
        }
        if (message.type === 'error') {
          setViewState((prev) => ({ ...prev, error: message.message }));
          setGameError(message.message);
          if (message.message === 'Game in progress.' || message.message === 'Session not found.') {
            clearActiveSessionState();
          }
          return;
        }
        setViewState((prev) => applyLobbyMessage(prev, message, currentSessionId));
      }
    });
    return () => {
      client.disconnect();
    };
  }, [client, playerId, serverUrl]);

  const handleCreateSession = () => {
    if (!isConnected) {
      return;
    }
    setViewState((prev) => ({ ...prev, error: null }));
    client.createSession();
  };

  const handleJoinSession = (sessionId: string) => {
    if (!isConnected) {
      return;
    }
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setViewState((prev) => ({ ...prev, error: 'Enter a name to join.' }));
      return;
    }
    setViewState((prev) => ({ ...prev, error: null, lobby: null }));
    setActiveSessionId(sessionId);
    activeSessionRef.current = sessionId;
    setGame(null);
    setGameError(null);
    client.join(sessionId, playerId, trimmedName);
  };
  const handleLeaveSession = () => {
    if (!activeSessionId) {
      return;
    }
    client.leave(activeSessionId, playerId);
    clearActiveSessionState();
    setViewState((prev) => ({ ...prev, lobby: null }));
  };
  const handleDeleteSession = (sessionId: string) => {
    if (!isConnected) {
      return;
    }
    client.deleteSession(sessionId);
    if (sessionId !== activeSessionRef.current) {
      return;
    }
    clearActiveSessionState();
    setViewState((prev) => ({ ...prev, lobby: null, error: null }));
  };

  const canStartGame =
    isConnected && !!activeSessionId && (viewState.lobby?.players.length ?? 0) >= 2;
  const handleStartGame = () => {
    if (!canStartGame || !activeSessionId) {
      return;
    }
    client.startGame(activeSessionId, playerId);
  };

  if (game) {
    return (
      <GameScreen
        game={game}
        playerId={playerId}
        onDrawTile={() => withSession((sessionId) => client.drawTile(sessionId, playerId))}
        onPlaceTile={(tileId, placement) =>
          withSession((sessionId) =>
            client.placeTile(sessionId, playerId, tileId, placement.position, placement.orientation)
          )
        }
        onPlaceMeeple={(placement) =>
          withSession((sessionId) => client.placeMeeple(sessionId, playerId, placement))
        }
        onSkipMeeple={() => withSession((sessionId) => client.skipMeeple(sessionId, playerId))}
        onUndo={() => withSession((sessionId) => client.undoTurn(sessionId, playerId))}
        error={gameError}
      />
    );
  }

  return (
    <LobbyPanel
      playerName={playerName}
      onNameChange={setPlayerName}
      onCreateSession={handleCreateSession}
      onJoinSession={handleJoinSession}
      onDeleteSession={handleDeleteSession}
      onLeaveSession={handleLeaveSession}
      onStartGame={handleStartGame}
      isConnected={isConnected}
      canStartGame={canStartGame}
      players={viewState.lobby?.players ?? []}
      sessions={viewState.sessions}
      activeSessionId={activeSessionId}
      error={viewState.error}
      serverUrl={serverUrl}
    />
  );
}
