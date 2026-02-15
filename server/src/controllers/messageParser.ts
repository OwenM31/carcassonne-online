/**
 * @description Parses incoming WebSocket messages into typed client actions.
 */
import type { ClientMessage } from '@carcassonne/shared';
import type { RawData } from 'ws';
import {
  isCoordinate,
  isMeeplePlacement,
  isOrientation,
  isRecord
} from './messageParserPredicates';

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
    if (parsed.deckSize !== undefined && !isSessionDeckSize(parsed.deckSize)) {
      return null;
    }
    return { type: 'create_session', deckSize: parsed.deckSize };
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
      typeof parsed.playerName !== 'string'
    ) {
      return null;
    }

    return {
      type: 'join_lobby',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId,
      playerName: parsed.playerName
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

  if (parsed.type === 'draw_tile') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }

    return {
      type: 'draw_tile',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId
    };
  }

  if (parsed.type === 'place_tile') {
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.playerId !== 'string' ||
      typeof parsed.tileId !== 'string'
    ) {
      return null;
    }

    if (!isCoordinate(parsed.position) || !isOrientation(parsed.orientation)) {
      return null;
    }

    return {
      type: 'place_tile',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId,
      tileId: parsed.tileId,
      position: parsed.position,
      orientation: parsed.orientation
    };
  }

  if (parsed.type === 'place_meeple') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }

    if (!isMeeplePlacement(parsed.placement)) {
      return null;
    }

    return {
      type: 'place_meeple',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId,
      placement: parsed.placement
    };
  }

  if (parsed.type === 'skip_meeple') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }

    return {
      type: 'skip_meeple',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId
    };
  }

  return null;
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
