/**
 * @description WebSocket client for lobby/session communication.
 */
import type {
  ClientMessage,
  Coordinate,
  MeeplePlacement,
  Orientation,
  ServerMessage,
  TileId
} from '@carcassonne/shared';

import { parseServerMessageEvent } from './lobbyProtocol';

export interface LobbyClientHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (message: string) => void;
  onMessage?: (message: ServerMessage) => void;
}

export class LobbyClient {
  private socket: WebSocket | null = null;
  private pending: ClientMessage[] = [];
  private handlers: LobbyClientHandlers | null = null;

  connect(url: string, handlers: LobbyClientHandlers) {
    this.disconnect();
    this.handlers = handlers;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.flushPending();
      handlers.onOpen?.();
    });

    socket.addEventListener('close', () => {
      handlers.onClose?.();
    });

    socket.addEventListener('error', () => {
      handlers.onError?.('Connection error.');
    });

    socket.addEventListener('message', (event) => {
      const message = parseServerMessageEvent(event);
      if (!message) {
        handlers.onError?.('Unrecognized message from server.');
        return;
      }
      handlers.onMessage?.(message);
    });
  }

  listSessions() {
    this.send({ type: 'list_sessions' });
  }

  createSession() {
    this.send({ type: 'create_session' });
  }

  deleteSession(sessionId: string) {
    this.send({ type: 'delete_session', sessionId });
  }

  join(sessionId: string, playerId: string, playerName: string) {
    this.send({ type: 'join_lobby', sessionId, playerId, playerName });
  }

  leave(sessionId: string, playerId: string) {
    this.send({ type: 'leave_lobby', sessionId, playerId });
  }

  startGame(sessionId: string, playerId: string) {
    this.send({ type: 'start_game', sessionId, playerId });
  }

  undoTurn(sessionId: string, playerId: string) {
    this.send({ type: 'undo_turn', sessionId, playerId });
  }

  drawTile(sessionId: string, playerId: string) {
    this.send({ type: 'draw_tile', sessionId, playerId });
  }

  placeTile(
    sessionId: string,
    playerId: string,
    tileId: TileId,
    position: Coordinate,
    orientation: Orientation
  ) {
    this.send({ type: 'place_tile', sessionId, playerId, tileId, position, orientation });
  }

  placeMeeple(sessionId: string, playerId: string, placement: MeeplePlacement) {
    this.send({ type: 'place_meeple', sessionId, playerId, placement });
  }

  skipMeeple(sessionId: string, playerId: string) {
    this.send({ type: 'skip_meeple', sessionId, playerId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
    this.socket = null;
    this.pending = [];
  }

  private send(message: ClientMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return;
    }

    this.pending.push(message);
  }

  private flushPending() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.pending.forEach((message) => {
      this.socket?.send(JSON.stringify(message));
    });
    this.pending = [];
  }
}
