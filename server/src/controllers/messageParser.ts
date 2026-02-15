/**
 * @description Parses incoming WebSocket messages into typed client actions.
 */
import type { ClientMessage } from '@carcassonne/shared';
import type { RawData } from 'ws';
import { isRecord } from './messageParserPredicates';
import { parseGameActionMessage } from './messageParserGameActions';

export function parseClientMessage(raw: RawData): ClientMessage | null {
  const payload = readRawData(raw);
  if (!payload) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.type !== 'string') {
    return null;
  }
  if (parsed.type === 'list_sessions') {
    return { type: 'list_sessions' };
  }

  if (parsed.type === 'create_session') {
    if (
      (parsed.deckSize !== undefined && !isSessionDeckSize(parsed.deckSize)) ||
      (parsed.mode !== undefined && !isSessionMode(parsed.mode)) ||
      (parsed.turnTimerSeconds !== undefined &&
        !isSessionTurnTimer(parsed.turnTimerSeconds))
    ) {
      return null;
    }

    const message: Extract<ClientMessage, { type: 'create_session' }> = { type: 'create_session' };
    if (parsed.deckSize !== undefined) {
      message.deckSize = parsed.deckSize;
    }
    if (parsed.mode !== undefined) {
      message.mode = parsed.mode;
    }
    if (parsed.turnTimerSeconds !== undefined) {
      message.turnTimerSeconds = parsed.turnTimerSeconds;
    }
    return message;
  }

  if (parsed.type === 'set_session_deck_size') {
    if (typeof parsed.sessionId !== 'string' || !isSessionDeckSize(parsed.deckSize)) {
      return null;
    }
    return {
      type: 'set_session_deck_size',
      sessionId: parsed.sessionId,
      deckSize: parsed.deckSize
    };
  }

  if (parsed.type === 'set_session_mode') {
    if (typeof parsed.sessionId !== 'string' || !isSessionMode(parsed.mode)) {
      return null;
    }
    return {
      type: 'set_session_mode',
      sessionId: parsed.sessionId,
      mode: parsed.mode
    };
  }

  if (parsed.type === 'set_session_turn_timer') {
    if (
      typeof parsed.sessionId !== 'string' ||
      !isSessionTurnTimer(parsed.turnTimerSeconds)
    ) {
      return null;
    }
    return {
      type: 'set_session_turn_timer',
      sessionId: parsed.sessionId,
      turnTimerSeconds: parsed.turnTimerSeconds
    };
  }

  if (parsed.type === 'delete_session') {
    if (typeof parsed.sessionId !== 'string') {
      return null;
    }

    return {
      type: 'delete_session',
      sessionId: parsed.sessionId
    };
  }

  if (parsed.type === 'join_lobby') {
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.playerId !== 'string' ||
      typeof parsed.playerName !== 'string' ||
      (parsed.playerPin !== undefined && typeof parsed.playerPin !== 'string')
    ) {
      return null;
    }

    return {
      type: 'join_lobby',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId,
      playerName: parsed.playerName,
      playerPin: parsed.playerPin
    };
  }

  if (parsed.type === 'leave_lobby') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }

    return {
      type: 'leave_lobby',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId
    };
  }

  if (parsed.type === 'start_game') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }

    return {
      type: 'start_game',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId
    };
  }

  if (parsed.type === 'undo_turn') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }

    return {
      type: 'undo_turn',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId
    };
  }

  if (parsed.type === 'reset_sandbox_board') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }

    return {
      type: 'reset_sandbox_board',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId
    };
  }

  return parseGameActionMessage(parsed);
}

function readRawData(raw: RawData): string | null {
  if (typeof raw === 'string') {
    return raw;
  }

  if (raw instanceof Buffer) {
    return raw.toString('utf8');
  }

  if (Array.isArray(raw)) {
    return Buffer.concat(raw).toString('utf8');
  }

  return null;
}

function isSessionDeckSize(value: unknown): value is 'standard' | 'small' {
  return value === 'standard' || value === 'small';
}

function isSessionMode(value: unknown): value is 'standard' | 'sandbox' {
  return value === 'standard' || value === 'sandbox';
}

function isSessionTurnTimer(value: unknown): value is 30 | 60 | 90 {
  return value === 30 || value === 60 || value === 90;
}
