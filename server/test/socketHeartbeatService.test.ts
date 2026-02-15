/**
 * @description Tests for websocket heartbeat stale-connection detection.
 */
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';

import { SocketHeartbeatService } from '../src/services/socketHeartbeatService';

class TestSocket extends EventEmitter {
  readyState = WebSocket.OPEN;
  pingCalls = 0;
  terminateCalls = 0;

  ping(): void {
    this.pingCalls += 1;
  }

  terminate(): void {
    this.terminateCalls += 1;
  }

  sendPong(): void {
    this.emit('pong');
  }
}

describe('SocketHeartbeatService', () => {
  it('pings healthy sockets and terminates stale sockets', () => {
    const service = new SocketHeartbeatService();
    const socket = new TestSocket() as unknown as WebSocket;

    service.register(socket);

    service.tick();
    expect((socket as unknown as TestSocket).pingCalls).toBe(1);
    expect((socket as unknown as TestSocket).terminateCalls).toBe(0);

    service.tick();
    expect((socket as unknown as TestSocket).terminateCalls).toBe(1);
  });

  it('keeps sockets alive when pong is received between ticks', () => {
    const service = new SocketHeartbeatService();
    const socket = new TestSocket();

    service.register(socket as unknown as WebSocket);

    service.tick();
    socket.sendPong();
    service.tick();

    expect(socket.terminateCalls).toBe(0);
    expect(socket.pingCalls).toBe(2);
  });
});
