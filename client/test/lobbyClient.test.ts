/**
 * @description Tests for lobby websocket client queueing and reconnect behavior.
 */
import { LobbyClient } from '../src/services/lobbyClient';

const WS_CONNECTING = 0;
const WS_OPEN = 1;
const WS_CLOSING = 2;
const WS_CLOSED = 3;

type MessageEventListener = (event: MessageEvent) => void;
type GenericEventListener = () => void;

class MockWebSocket {
  static OPEN = WS_OPEN;
  static instances: MockWebSocket[] = [];

  readonly sent: string[] = [];
  readyState = WS_CONNECTING;

  private openListeners: GenericEventListener[] = [];
  private closeListeners: GenericEventListener[] = [];
  private errorListeners: GenericEventListener[] = [];
  private messageListeners: MessageEventListener[] = [];

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: 'open' | 'close' | 'error', listener: GenericEventListener): void;
  addEventListener(type: 'message', listener: MessageEventListener): void;
  addEventListener(type: string, listener: GenericEventListener | MessageEventListener): void {
    if (type === 'open') {
      this.openListeners.push(listener as GenericEventListener);
      return;
    }

    if (type === 'close') {
      this.closeListeners.push(listener as GenericEventListener);
      return;
    }

    if (type === 'error') {
      this.errorListeners.push(listener as GenericEventListener);
      return;
    }

    if (type === 'message') {
      this.messageListeners.push(listener as MessageEventListener);
    }
  }

  send(message: string): void {
    this.sent.push(message);
  }

  close(): void {
    this.readyState = WS_CLOSED;
    this.closeListeners.forEach((listener) => listener());
  }

  emitOpen(): void {
    this.readyState = WS_OPEN;
    this.openListeners.forEach((listener) => listener());
  }

  emitMessage(payload: string): void {
    const event = { data: payload } as MessageEvent;
    this.messageListeners.forEach((listener) => listener(event));
  }
}

describe('LobbyClient', () => {
  const OriginalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    Object.assign(globalThis, {
      WebSocket: MockWebSocket
    });
  });

  afterAll(() => {
    Object.assign(globalThis, {
      WebSocket: OriginalWebSocket
    });
  });

  it('retains queued messages when reconnecting and flushes them after rejoin', () => {
    const client = new LobbyClient();

    client.connect('ws://localhost:3001', {
      onOpen: () => {
        client.join('session-1', 'p1', 'Ada');
      }
    });

    client.drawTile('session-1', 'p1');

    client.connect('ws://localhost:3001', {
      onOpen: () => {
        client.join('session-1', 'p1', 'Ada');
      }
    });

    const latestSocket = MockWebSocket.instances[1];
    latestSocket.emitOpen();

    const sentTypes = latestSocket.sent.map((payload) => {
      const parsed = JSON.parse(payload) as { type: string };
      return parsed.type;
    });

    expect(sentTypes).toEqual(['join_lobby', 'draw_tile']);
  });

  it('clears queued messages on explicit disconnect', () => {
    const client = new LobbyClient();

    client.connect('ws://localhost:3001', {});
    client.drawTile('session-1', 'p1');

    client.disconnect();

    client.connect('ws://localhost:3001', {});
    const latestSocket = MockWebSocket.instances[1];
    latestSocket.emitOpen();

    expect(latestSocket.sent).toEqual([]);
  });

  it('forwards parsed server messages to listeners', () => {
    const client = new LobbyClient();
    const messages: string[] = [];

    client.connect('ws://localhost:3001', {
      onMessage: (message) => {
        messages.push(message.type);
      }
    });

    const socket = MockWebSocket.instances[0];
    socket.emitMessage(JSON.stringify({ type: 'error', message: 'nope' }));

    expect(messages).toEqual(['error']);
  });
});
