/**
 * @description Resilient lobby websocket lifecycle with reconnect backoff and auto-rejoin.
 */
import { LobbyClient } from './lobbyClient';
import type { ServerMessage } from '@carcassonne/shared';

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 10_000;

export interface LobbyConnectionOptions {
  client: LobbyClient;
  serverUrl: string;
  playerId: string;
  getActiveSessionId: () => string | null;
  getReconnectName: () => string | null;
  getReconnectPin: () => string | null;
  setConnected: (connected: boolean) => void;
  setError: (message: string) => void;
  onMessage: (message: ServerMessage) => void;
}

export interface LobbyConnectionController {
  stop: () => void;
}

export function startLobbyConnection({
  client,
  serverUrl,
  playerId,
  getActiveSessionId,
  getReconnectName,
  getReconnectPin,
  setConnected,
  setError,
  onMessage
}: LobbyConnectionOptions): LobbyConnectionController {
  let reconnectTimer: number | null = null;
  let reconnectAttempts = 0;
  let shouldReconnect = true;

  const clearReconnectTimer = () => {
    if (reconnectTimer === null) {
      return;
    }

    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };

  const connect = () => {
    client.connect(serverUrl, {
      onOpen: () => {
        clearReconnectTimer();
        reconnectAttempts = 0;
        setConnected(true);
        client.listSessions();

        const currentSessionId = getActiveSessionId();
        if (!currentSessionId) {
          return;
        }

        const reconnectName = getReconnectName();
        if (!reconnectName) {
          setError('Enter a name to reconnect.');
          return;
        }

        const reconnectPin = getReconnectPin();
        client.join(currentSessionId, playerId, reconnectName, reconnectPin ?? undefined);
      },
      onClose: () => {
        setConnected(false);
        if (!shouldReconnect || reconnectTimer !== null) {
          return;
        }

        reconnectAttempts += 1;
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * 2 ** (reconnectAttempts - 1),
          RECONNECT_MAX_DELAY_MS
        );
        setError(`Connection lost. Retrying in ${Math.ceil(delay / 1000)}s...`);
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, delay);
      },
      onError: (message) => {
        setError(message);
      },
      onMessage
    });
  };

  connect();

  return {
    stop: () => {
      shouldReconnect = false;
      clearReconnectTimer();
      client.disconnect();
    }
  };
}
