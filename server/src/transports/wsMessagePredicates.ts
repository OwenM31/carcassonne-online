/**
 * @description Type guards for routing websocket message categories.
 */
import type {
  ClientMessage,
  DrawSandboxTileAction,
  DrawTileAction,
  PlaceMeepleAction,
  PlaceTileAction,
  SessionId,
  SkipMeepleAction
} from '@carcassonne/shared';

export function isLobbyMessage(message: ClientMessage): boolean {
  return (
    message.type === 'join_lobby' ||
    message.type === 'leave_lobby' ||
    message.type === 'start_game'
  );
}

type SessionGameAction = (
  | DrawSandboxTileAction
  | DrawTileAction
  | PlaceTileAction
  | PlaceMeepleAction
  | SkipMeepleAction
) & { sessionId: SessionId };

export function isGameAction(message: ClientMessage): message is SessionGameAction {
  return (
    message.type === 'draw_tile' ||
    message.type === 'draw_sandbox_tile' ||
    message.type === 'place_tile' ||
    message.type === 'place_meeple' ||
    message.type === 'skip_meeple'
  );
}

export function hasSessionId(message: ClientMessage): message is ClientMessage & { sessionId: SessionId } {
  return 'sessionId' in message && typeof message.sessionId === 'string';
}

export function shouldRefreshSessions(message: ClientMessage): boolean {
  return (
    message.type === 'join_lobby' ||
    message.type === 'leave_lobby' ||
    message.type === 'start_game'
  );
}
