/**
 * @description WebSocket client for lobby/session communication.
 */
import type {
  ClientMessage,
  Coordinate,
  MeepleKind,
  MeeplePlacement,
  Orientation,
  PlayerColor,
  SessionAddon,
  SessionAiProfile,
  SessionDeckSize,
  SessionMode,
  SessionTakeoverBot,
  SessionTurnTimer,
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
    this.closeSocket(false);
    this.handlers = handlers;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener('open', () => {
      handlers.onOpen?.();
      this.flushPending();
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

  createSession(
    deckSize: SessionDeckSize = 'standard',
    mode: SessionMode = 'standard',
    addons: SessionAddon[] = [],
    turnTimerSeconds: SessionTurnTimer = 0
  ) {
    this.send({ type: 'create_session', deckSize, mode, addons, turnTimerSeconds });
  }

  setSessionDeckSize(sessionId: string, deckSize: SessionDeckSize) {
    this.send({ type: 'set_session_deck_size', sessionId, deckSize });
  }

  setSessionMode(sessionId: string, mode: SessionMode) {
    this.send({ type: 'set_session_mode', sessionId, mode });
  }

  setSessionAddons(sessionId: string, addons: SessionAddon[]) {
    this.send({ type: 'set_session_addons', sessionId, addons });
  }

  setSessionPlayerColor(sessionId: string, color: PlayerColor, targetPlayerId?: string) {
    this.send({ type: 'set_session_player_color', sessionId, color, targetPlayerId });
  }

  setSessionTurnTimer(sessionId: string, turnTimerSeconds: SessionTurnTimer) {
    this.send({ type: 'set_session_turn_timer', sessionId, turnTimerSeconds });
  }

  setSessionTakeoverBot(sessionId: string, takeoverBot: SessionTakeoverBot) {
    this.send({ type: 'set_session_takeover_bot', sessionId, takeoverBot });
  }

  addAiPlayer(sessionId: string, aiProfile: SessionAiProfile = 'randy') {
    this.send({ type: 'add_ai_player', sessionId, aiProfile });
  }

  removeAiPlayer(sessionId: string, aiPlayerId: string) {
    this.send({ type: 'remove_ai_player', sessionId, aiPlayerId });
  }

  deleteSession(sessionId: string) {
    this.send({ type: 'delete_session', sessionId });
  }

  join(sessionId: string, playerId: string, playerName: string, playerPin?: string) {
    this.send({ type: 'join_lobby', sessionId, playerId, playerName, playerPin });
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

  redoTurn(sessionId: string, playerId: string) {
    this.send({ type: 'redo_turn', sessionId, playerId });
  }

  resetSandboxBoard(sessionId: string, playerId: string) {
    this.send({ type: 'reset_sandbox_board', sessionId, playerId });
  }

  drawTile(sessionId: string, playerId: string) {
    this.send({ type: 'draw_tile', sessionId, playerId });
  }

  drawSandboxTile(sessionId: string, playerId: string, tileId: TileId) {
    this.send({ type: 'draw_sandbox_tile', sessionId, playerId, tileId });
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

  setTileOrientation(sessionId: string, playerId: string, orientation: Orientation) {
    this.send({ type: 'set_tile_orientation', sessionId, playerId, orientation });
  }

  placeMeeple(
    sessionId: string,
    playerId: string,
    placement: MeeplePlacement,
    kind: MeepleKind = 'normal'
  ) {
    this.send({ type: 'place_meeple', sessionId, playerId, placement, kind });
  }

  skipMeeple(sessionId: string, playerId: string) {
    this.send({ type: 'skip_meeple', sessionId, playerId });
  }

  returnAbbot(sessionId: string, playerId: string) {
    this.send({ type: 'return_abbot', sessionId, playerId });
  }

  disconnect() {
    this.closeSocket(true);
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

  private closeSocket(clearPending: boolean) {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
    }

    this.socket = null;
    if (clearPending) {
      this.pending = [];
    }
  }
}
