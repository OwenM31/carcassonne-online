/**
 * @description Utilities shared by websocket server transport handlers.
 */
import type { ServerMessage } from '@carcassonne/shared';

import type { SessionService } from '../services/sessionService';

export function buildSessionListMessage(service: SessionService): ServerMessage {
  return {
    type: 'session_list',
    sessions: service.listSessions()
  };
}

export function readDurationMs(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}
