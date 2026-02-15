/**
 * @description WebSocket transport for session, lobby, and game messages.
 */
import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type { ServerMessage } from '@carcassonne/shared';

import { createGameController } from '../controllers/gameController';
import { createLobbyController } from '../controllers/lobbyController';
import { parseClientMessage } from '../controllers/messageParser';
import { SocketHeartbeatService } from '../services/socketHeartbeatService';
import type { SessionService } from '../services/sessionService';
import { SocketPresenceService } from '../services/socketPresenceService';
import { TurnTimerService } from '../services/turnTimerService';
import {
  hasSessionId,
  requiresBoundPlayer,
  isGameAction,
  isLobbyMessage,
  shouldRefreshSessions
} from './wsMessagePredicates';
import { buildSessionListMessage, readDurationMs } from './wsServerSupport';

interface WsServerOptions {
  server: HttpServer;
  sessionService: SessionService;
}

export function createWsServer({ server, sessionService }: WsServerOptions) {
  const wss = new WebSocketServer({ server });
  const disconnectGraceMs = readDurationMs(process.env.DISCONNECT_GRACE_MS, 90_000);
  const heartbeatIntervalMs = readDurationMs(process.env.HEARTBEAT_INTERVAL_MS, 30_000);
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
  const turnTimerService = new TurnTimerService({ sessionService, broadcast });
  const presenceService = new SocketPresenceService(
    disconnectGraceMs,
    (sessionId, playerId) => {
      const session = sessionService.getSession(sessionId);
      if (!session) {
        broadcast(buildSessionListMessage(sessionService));
        return;
      }

      const lobbyController = createLobbyController(
        sessionId,
        session.lobbyService,
        session.gameService,
        () => ({
          deckSize: session.deckSize,
          mode: session.mode,
          turnTimerSeconds: session.turnTimerSeconds
        }),
        (aiProfile) => {
          const addResult = sessionService.addAiPlayer(sessionId, aiProfile);
          if (addResult.type === 'error') {
            return addResult;
          }

          return {
            type: 'success',
            lobby: addResult.session.lobbyService.getState()
          };
        },
        (playerId) => sessionService.isAiPlayer(sessionId, playerId)
      );
      const response = lobbyController.handleDisconnect(playerId);
      sessionService.persist();
      broadcast(response);
      broadcast(buildSessionListMessage(sessionService));
      turnTimerService.syncSession(sessionId);
    }
  );
  const heartbeatService = new SocketHeartbeatService();
  turnTimerService.syncAllSessions();
  heartbeatService.start(heartbeatIntervalMs);
  wss.on('connection', (socket) => {
    heartbeatService.register(socket);
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
        sessionService.createSession(parsed.deckSize, parsed.mode, parsed.turnTimerSeconds);
        broadcast(buildSessionListMessage(sessionService));
        return;
      }
      if (parsed.type === 'set_session_deck_size') {
        const updateResult = sessionService.updateSessionDeckSize(
          parsed.sessionId,
          parsed.deckSize
        );
        if (updateResult.type === 'error') {
          sendTo(socket, { type: 'error', message: updateResult.message });
          return;
        }
        broadcast(buildSessionListMessage(sessionService));
        return;
      }
      if (parsed.type === 'set_session_mode') {
        const updateResult = sessionService.updateSessionMode(
          parsed.sessionId,
          parsed.mode
        );
        if (updateResult.type === 'error') {
          sendTo(socket, { type: 'error', message: updateResult.message });
          return;
        }
        broadcast(buildSessionListMessage(sessionService));
        return;
      }
      if (parsed.type === 'set_session_turn_timer') {
        const updateResult = sessionService.updateSessionTurnTimer(
          parsed.sessionId,
          parsed.turnTimerSeconds
        );
        if (updateResult.type === 'error') {
          sendTo(socket, { type: 'error', message: updateResult.message });
          return;
        }
        broadcast(buildSessionListMessage(sessionService));
        return;
      }
      if (parsed.type === 'delete_session') {
        const deleted = sessionService.deleteSession(parsed.sessionId);
        if (!deleted) {
          sendTo(socket, { type: 'error', message: 'Session not found.' });
          return;
        }
        turnTimerService.clearSession(parsed.sessionId);
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
        session.gameService,
        () => ({
          deckSize: session.deckSize,
          mode: session.mode,
          turnTimerSeconds: session.turnTimerSeconds
        }),
        (aiProfile) => {
          const addResult = sessionService.addAiPlayer(parsed.sessionId, aiProfile);
          if (addResult.type === 'error') {
            return addResult;
          }

          return {
            type: 'success',
            lobby: addResult.session.lobbyService.getState()
          };
        },
        (playerId) => sessionService.isAiPlayer(parsed.sessionId, playerId)
      );
      const gameController = createGameController(parsed.sessionId, session.gameService);
      if (
        requiresBoundPlayer(parsed) &&
        !presenceService.isBoundTo(socket, parsed.sessionId, parsed.playerId)
      ) {
        sendTo(socket, { type: 'error', message: 'Rejoin the session before acting.' });
        return;
      }
      let response: ServerMessage;
      if (isLobbyMessage(parsed)) {
        response = lobbyController.handleMessage(parsed);
      } else if (parsed.type === 'undo_turn') {
        response = gameController.handleUndo(parsed.playerId);
      } else if (parsed.type === 'reset_sandbox_board') {
        response = gameController.handleSandboxReset(parsed.playerId);
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
      sessionService.persist();
      if (parsed.type === 'join_lobby') {
        presenceService.bind(socket, parsed.sessionId, parsed.playerId);
      }
      if (parsed.type === 'leave_lobby') {
        presenceService.clearPendingDisconnect(parsed.sessionId, parsed.playerId);
        presenceService.unbind(socket);
      }
      broadcast(response);
      turnTimerService.syncSession(parsed.sessionId);
      if (shouldRefreshSessions(parsed)) {
        broadcast(buildSessionListMessage(sessionService));
      }
    });

    socket.on('close', () => {
      heartbeatService.unregister(socket);
      presenceService.scheduleGracefulDisconnect(socket);
    });
  });

  wss.on('close', () => {
    heartbeatService.dispose();
    presenceService.dispose();
    turnTimerService.dispose();
  });
  return wss;
}
