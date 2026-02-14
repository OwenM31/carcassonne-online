/**
 * @description Tests for parsing incoming client messages.
 */
import { parseClientMessage } from '../src/controllers/messageParser';

describe('parseClientMessage', () => {
  it('parses delete_session payloads', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'delete_session', sessionId: 'session-1' }))
    );

    expect(result).toEqual({ type: 'delete_session', sessionId: 'session-1' });
  });

  it('rejects delete_session payloads without a session id', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'delete_session' }))
    );

    expect(result).toBeNull();
  });
});
