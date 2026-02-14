/**
 * @description WebSocket transport for session, lobby, and game messages.
 */
import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  ClientMessage,
  DrawTileAction,
  PlaceMeepleAction,
  PlaceTileAction,
  ServerMessage,
  SessionId,
  SkipMeepleAction
} from '@carcassonne/shared';

import { createGameController } from '../controllers/gameController';
import { createLobbyController } from '../controllers/lobbyController';
import { parseClientMessage } from '../controllers/messageParser';
import type { SessionService } from '../services/sessionService';

interface WsServerOptions {
  server: HttpServer;
  sessionService: SessionService;
}

export function createWsServer({ server, sessionService }: WsServerOptions) {
  const wss = new WebSocketServer({ server });
  const sessionBySocket = new Map<WebSocket, { sessionId: SessionId; playerId: string }>();

  const broadcast = (message: ServerMessage) => {
    const payload = JSON.stringify(message);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  };

  const sendTo = (socket: WebSocket, message: ServerMessage) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  wss.on('connection', (socket) => {
    socket.on('message', (raw) => {
      const parsed = parseClientMessage(raw);
      if (!parsed) {
        sendTo(socket, { type: 'error', message: 'Invalid message.' });
        return;
      }

      if (parsed.type === 'list_sessions') {
        sendTo(socket, buildSessionListMessage(sessionService));
        return;
      }

      if (parsed.type === 'create_session') {
        sessionService.createSession();
        broadcast(buildSessionListMessage(sessionService));
        return;
      }

      if (parsed.type === 'delete_session') {
        const deleted = sessionService.deleteSession(parsed.sessionId);
        if (!deleted) {
          sendTo(socket, { type: 'error', message: 'Session not found.' });
          return;
        }

        broadcast(buildSessionListMessage(sessionService));
        return;
      }

      if (!hasSessionId(parsed)) {
        sendTo(socket, { type: 'error', message: 'Session id is required.' });
        return;
      }

      const session = sessionService.getSession(parsed.sessionId);
      if (!session) {
        sendTo(socket, { type: 'error', message: 'Session not found.' });
        return;
      }

      const lobbyController = createLobbyController(
        parsed.sessionId,
        session.lobbyService,
        session.gameService
      );
      const gameController = createGameController(parsed.sessionId, session.gameService);

      let response: ServerMessage;
      if (isLobbyMessage(parsed)) {
        response = lobbyController.handleMessage(parsed);
      } else if (parsed.type === 'undo_turn') {
        response = gameController.handleUndo(parsed.playerId);
      } else if (isGameAction(parsed)) {
        response = gameController.handleAction(parsed);
      } else {
        sendTo(socket, { type: 'error', message: 'Unsupported message type.' });
        return;
      }
      if (response.type === 'error') {
        sendTo(socket, response);
        return;
      }

      if (parsed.type === 'join_lobby') {
        sessionBySocket.set(socket, {
          sessionId: parsed.sessionId,
          playerId: parsed.playerId
        });
      }

      if (parsed.type === 'leave_lobby') {
        sessionBySocket.delete(socket);
      }

      broadcast(response);

      if (shouldRefreshSessions(parsed)) {
        broadcast(buildSessionListMessage(sessionService));
      }
    });

    socket.on('close', () => {
      const sessionInfo = sessionBySocket.get(socket);
      sessionBySocket.delete(socket);
      if (!sessionInfo) {
        return;
      }

      const session = sessionService.getSession(sessionInfo.sessionId);
      if (!session) {
        broadcast(buildSessionListMessage(sessionService));
        return;
      }

      const lobbyController = createLobbyController(
        sessionInfo.sessionId,
        session.lobbyService,
        session.gameService
      );
      const response = lobbyController.handleDisconnect(sessionInfo.playerId);
      broadcast(response);
      broadcast(buildSessionListMessage(sessionService));
    });
  });

  return wss;
}

function isLobbyMessage(message: ClientMessage): boolean {
  return (
    message.type === 'join_lobby' ||
    message.type === 'leave_lobby' ||
    message.type === 'start_game'
  );
}

type SessionGameAction = (
  | DrawTileAction
  | PlaceTileAction
  | PlaceMeepleAction
  | SkipMeepleAction
) & { sessionId: SessionId };

function isGameAction(message: ClientMessage): message is SessionGameAction {
  return (
    message.type === 'draw_tile' ||
    message.type === 'place_tile' ||
    message.type === 'place_meeple' ||
    message.type === 'skip_meeple'
  );
}

function hasSessionId(
  message: ClientMessage
): message is ClientMessage & { sessionId: SessionId } {
  return 'sessionId' in message && typeof message.sessionId === 'string';
}

function buildSessionListMessage(service: SessionService): ServerMessage {
  return {
    type: 'session_list',
    sessions: service.listSessions()
  };
}

function shouldRefreshSessions(message: ClientMessage): boolean {
  return (
    message.type === 'join_lobby' ||
    message.type === 'leave_lobby' ||
    message.type === 'start_game'
  );
}
