/**
 * @description Parses incoming WebSocket messages into typed client actions.
 */
import {
  SESSION_ADDONS,
  type ClientMessage,
  type PlayerColor,
  type SessionAddon,
  type SessionAiProfile,
  type SessionTakeoverBot,
  type SessionTurnTimer
} from '@carcassonne/shared';
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
      (parsed.addons !== undefined && !isSessionAddons(parsed.addons)) ||
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
    if (parsed.addons !== undefined) {
      message.addons = parsed.addons;
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

  if (parsed.type === 'set_session_addons') {
    if (typeof parsed.sessionId !== 'string' || !isSessionAddons(parsed.addons)) {
      return null;
    }
    return {
      type: 'set_session_addons',
      sessionId: parsed.sessionId,
      addons: parsed.addons
    };
  }

  if (parsed.type === 'set_session_player_color') {
    if (
      typeof parsed.sessionId !== 'string' ||
      !isPlayerColor(parsed.color) ||
      (parsed.targetPlayerId !== undefined && typeof parsed.targetPlayerId !== 'string')
    ) {
      return null;
    }
    const message: Extract<ClientMessage, { type: 'set_session_player_color' }> = {
      type: 'set_session_player_color',
      sessionId: parsed.sessionId,
      color: parsed.color
    };
    if (parsed.targetPlayerId !== undefined) {
      message.targetPlayerId = parsed.targetPlayerId;
    }
    return message;
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

  if (parsed.type === 'set_session_takeover_bot') {
    if (
      typeof parsed.sessionId !== 'string' ||
      !isSessionTakeoverBot(parsed.takeoverBot)
    ) {
      return null;
    }
    return {
      type: 'set_session_takeover_bot',
      sessionId: parsed.sessionId,
      takeoverBot: parsed.takeoverBot
    };
  }

  if (parsed.type === 'add_ai_player') {
    if (
      typeof parsed.sessionId !== 'string' ||
      (parsed.aiProfile !== undefined && !isSessionAiProfile(parsed.aiProfile))
    ) {
      return null;
    }

    return {
      type: 'add_ai_player',
      sessionId: parsed.sessionId,
      aiProfile: parsed.aiProfile
    };
  }

  if (parsed.type === 'remove_ai_player') {
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.aiPlayerId !== 'string'
    ) {
      return null;
    }

    return {
      type: 'remove_ai_player',
      sessionId: parsed.sessionId,
      aiPlayerId: parsed.aiPlayerId
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

  if (parsed.type === 'redo_turn') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }

    return {
      type: 'redo_turn',
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

function isSessionTurnTimer(value: unknown): value is SessionTurnTimer {
  return value === 0 || value === 1 || value === 30 || value === 60 || value === 90;
}

function isSessionAiProfile(value: unknown): value is SessionAiProfile {
  return value === 'randy' || value === 'martin' || value === 'juan';
}

function isSessionTakeoverBot(value: unknown): value is SessionTakeoverBot {
  return value === 'randy' || value === 'martin' || value === 'juan';
}

function isPlayerColor(value: unknown): value is PlayerColor {
  return (
    value === 'black' ||
    value === 'red' ||
    value === 'yellow' ||
    value === 'green' ||
    value === 'blue' ||
    value === 'gray' ||
    value === 'pink'
  );
}

function isSessionAddon(value: unknown): value is SessionAddon {
  return typeof value === 'string' && SESSION_ADDONS.includes(value as SessionAddon);
}

function isSessionAddons(value: unknown): value is SessionAddon[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => isSessionAddon(entry)) &&
    new Set(value).size === value.length
  );
}
