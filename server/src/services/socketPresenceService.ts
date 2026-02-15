/**
 * @description Tracks socket presence and delays disconnect cleanup to allow fast reconnects.
 */
import type { SessionId } from '@carcassonne/shared';
import type { WebSocket } from 'ws';

interface PresenceIdentity {
  sessionId: SessionId;
  playerId: string;
}

export class SocketPresenceService {
  private sessionBySocket = new Map<WebSocket, PresenceIdentity>();
  private connectionCountByKey = new Map<string, number>();
  private disconnectTimersByKey = new Map<string, ReturnType<typeof setTimeout>>();
  private graceMs: number;
  private onDisconnectExpired: (sessionId: SessionId, playerId: string) => void;

  constructor(
    graceMs: number,
    onDisconnectExpired: (sessionId: SessionId, playerId: string) => void
  ) {
    this.graceMs = graceMs;
    this.onDisconnectExpired = onDisconnectExpired;
  }

  bind(socket: WebSocket, sessionId: SessionId, playerId: string): void {
    this.unbind(socket);

    const key = toPresenceKey(sessionId, playerId);
    this.clearPendingDisconnect(sessionId, playerId);
    this.sessionBySocket.set(socket, { sessionId, playerId });
    this.connectionCountByKey.set(key, (this.connectionCountByKey.get(key) ?? 0) + 1);
  }

  unbind(socket: WebSocket): PresenceIdentity | null {
    const identity = this.sessionBySocket.get(socket);
    if (!identity) {
      return null;
    }

    this.sessionBySocket.delete(socket);
    const key = toPresenceKey(identity.sessionId, identity.playerId);
    const nextCount = (this.connectionCountByKey.get(key) ?? 1) - 1;
    if (nextCount <= 0) {
      this.connectionCountByKey.delete(key);
      return identity;
    }

    this.connectionCountByKey.set(key, nextCount);
    return null;
  }

  isBoundTo(socket: WebSocket, sessionId: SessionId, playerId: string): boolean {
    const identity = this.sessionBySocket.get(socket);
    if (!identity) {
      return false;
    }

    return identity.sessionId === sessionId && identity.playerId === playerId;
  }

  scheduleGracefulDisconnect(socket: WebSocket): void {
    const identity = this.unbind(socket);
    if (!identity) {
      return;
    }

    const key = toPresenceKey(identity.sessionId, identity.playerId);
    if (this.disconnectTimersByKey.has(key)) {
      return;
    }

    const timer = setTimeout(() => {
      this.disconnectTimersByKey.delete(key);
      if ((this.connectionCountByKey.get(key) ?? 0) > 0) {
        return;
      }

      this.onDisconnectExpired(identity.sessionId, identity.playerId);
    }, this.graceMs);

    this.disconnectTimersByKey.set(key, timer);
  }

  clearPendingDisconnect(sessionId: SessionId, playerId: string): void {
    const key = toPresenceKey(sessionId, playerId);
    const timer = this.disconnectTimersByKey.get(key);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.disconnectTimersByKey.delete(key);
  }

  dispose(): void {
    this.disconnectTimersByKey.forEach((timer) => clearTimeout(timer));
    this.disconnectTimersByKey.clear();
    this.connectionCountByKey.clear();
    this.sessionBySocket.clear();
  }
}

function toPresenceKey(sessionId: SessionId, playerId: string): string {
  return `${sessionId}:${playerId}`;
}
