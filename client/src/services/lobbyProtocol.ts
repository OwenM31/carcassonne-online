/**
 * @description Runtime validation for lobby WebSocket messages.
 */
import type { ServerMessage, SessionSummary } from '@carcassonne/shared';

import { isGameState } from './gameStateGuard';

export function parseServerMessageEvent(event: MessageEvent): ServerMessage | null {
  const raw = readMessageData(event.data);
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  return parseServerMessage(parsed);
}

function readMessageData(data: MessageEvent['data']): string | null {
  if (typeof data === 'string') {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  return null;
}

function parseServerMessage(value: unknown): ServerMessage | null {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return null;
  }

  if (value.type === 'error') {
    if (typeof value.message !== 'string') {
      return null;
    }
    return { type: 'error', message: value.message };
  }

  if (value.type === 'session_list') {
    if (!Array.isArray(value.sessions)) {
      return null;
    }

    const sessions: SessionSummary[] = [];
    for (const session of value.sessions) {
      if (!isSessionSummary(session)) {
        return null;
      }
      sessions.push(session);
    }

    return { type: 'session_list', sessions };
  }

  if (value.type === 'lobby_state') {
    if (typeof value.sessionId !== 'string') {
      return null;
    }

    if (!isRecord(value.lobby) || !Array.isArray(value.lobby.players)) {
      return null;
    }

    const players: { id: string; name: string }[] = [];

    for (const player of value.lobby.players) {
      if (!isRecord(player) || typeof player.id !== 'string' || typeof player.name !== 'string') {
        return null;
      }
      players.push({ id: player.id, name: player.name });
    }

    return { type: 'lobby_state', sessionId: value.sessionId, lobby: { players } };
  }

  if (value.type === 'game_started') {
    if (typeof value.sessionId !== 'string' || !isGameState(value.game)) {
      return null;
    }

    return { type: 'game_started', sessionId: value.sessionId, game: value.game };
  }

  if (value.type === 'game_state') {
    if (typeof value.sessionId !== 'string' || !isGameState(value.game)) {
      return null;
    }

    return { type: 'game_state', sessionId: value.sessionId, game: value.game };
  }

  return null;
}

function isSessionSummary(value: unknown): value is SessionSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.status === 'string' &&
    (value.status === 'lobby' || value.status === 'in_progress') &&
    typeof value.playerCount === 'number' &&
    (value.deckSize === 'standard' || value.deckSize === 'small') &&
    (value.mode === 'standard' || value.mode === 'sandbox')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
