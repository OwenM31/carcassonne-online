/**
 * @description Monitors websocket liveness with ping/pong heartbeats.
 */
import { WebSocket } from 'ws';

export class SocketHeartbeatService {
  private isAliveBySocket = new Map<WebSocket, boolean>();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  register(socket: WebSocket): void {
    this.unregister(socket);
    this.isAliveBySocket.set(socket, true);
    socket.on('pong', () => {
      this.isAliveBySocket.set(socket, true);
    });
  }

  unregister(socket: WebSocket): void {
    this.isAliveBySocket.delete(socket);
  }

  start(intervalMs: number): void {
    this.stop();
    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  tick(): void {
    this.isAliveBySocket.forEach((isAlive, socket) => {
      if (socket.readyState !== WebSocket.OPEN) {
        this.unregister(socket);
        return;
      }

      if (!isAlive) {
        socket.terminate();
        this.unregister(socket);
        return;
      }

      this.isAliveBySocket.set(socket, false);
      socket.ping();
    });
  }

  stop(): void {
    if (this.intervalId === null) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  dispose(): void {
    this.stop();
    this.isAliveBySocket.clear();
  }
}
