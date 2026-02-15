/**
 * @description Tests for socket presence binding and disconnect grace behavior.
 */
import type { WebSocket } from 'ws';

import { SocketPresenceService } from '../src/services/socketPresenceService';

describe('SocketPresenceService', () => {
  it('recognizes socket identity bindings', () => {
    const service = new SocketPresenceService(10_000, () => {
      // no-op
    });
    const socket = {} as WebSocket;

    service.bind(socket, 'session-1', 'p1');

    expect(service.isBoundTo(socket, 'session-1', 'p1')).toBe(true);
    expect(service.isBoundTo(socket, 'session-1', 'p2')).toBe(false);
  });

  it('does not expire disconnect if another socket is still bound', () => {
    jest.useFakeTimers();
    const expired: Array<{ sessionId: string; playerId: string }> = [];
    const service = new SocketPresenceService(5_000, (sessionId, playerId) => {
      expired.push({ sessionId, playerId });
    });

    const firstSocket = {} as WebSocket;
    const secondSocket = {} as WebSocket;

    service.bind(firstSocket, 'session-1', 'p1');
    service.bind(secondSocket, 'session-1', 'p1');

    service.scheduleGracefulDisconnect(firstSocket);
    jest.advanceTimersByTime(6_000);

    expect(expired).toEqual([]);

    service.scheduleGracefulDisconnect(secondSocket);
    jest.advanceTimersByTime(6_000);

    expect(expired).toEqual([{ sessionId: 'session-1', playerId: 'p1' }]);

    service.dispose();
    jest.useRealTimers();
  });
});
