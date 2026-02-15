/**
 * @description Tests for parsing incoming client messages.
 */
import { parseClientMessage } from '../src/controllers/messageParser';

describe('parseClientMessage', () => {
  it('parses create_session payloads with deck size', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'create_session', deckSize: 'small' }))
    );

    expect(result).toEqual({ type: 'create_session', deckSize: 'small' });
  });

  it('parses create_session payloads with session mode', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'create_session', mode: 'sandbox' }))
    );

    expect(result).toEqual({ type: 'create_session', mode: 'sandbox' });
  });

  it('rejects create_session payloads with invalid deck size', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'create_session', deckSize: 'tiny' }))
    );

    expect(result).toBeNull();
  });

  it('rejects create_session payloads with invalid mode', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'create_session', mode: 'practice' }))
    );

    expect(result).toBeNull();
  });

  it('parses set_session_deck_size payloads', () => {
    const result = parseClientMessage(
      Buffer.from(
        JSON.stringify({
          type: 'set_session_deck_size',
          sessionId: 'session-1',
          deckSize: 'standard'
        })
      )
    );

    expect(result).toEqual({
      type: 'set_session_deck_size',
      sessionId: 'session-1',
      deckSize: 'standard'
    });
  });

  it('parses set_session_mode payloads', () => {
    const result = parseClientMessage(
      Buffer.from(
        JSON.stringify({
          type: 'set_session_mode',
          sessionId: 'session-1',
          mode: 'sandbox'
        })
      )
    );

    expect(result).toEqual({
      type: 'set_session_mode',
      sessionId: 'session-1',
      mode: 'sandbox'
    });
  });

  it('parses delete_session payloads', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'delete_session', sessionId: 'session-1' }))
    );

    expect(result).toEqual({ type: 'delete_session', sessionId: 'session-1' });
  });

  it('parses draw_sandbox_tile payloads', () => {
    const result = parseClientMessage(
      Buffer.from(
        JSON.stringify({
          type: 'draw_sandbox_tile',
          sessionId: 'session-1',
          playerId: 'p1',
          tileId: 'T_R1C2'
        })
      )
    );

    expect(result).toEqual({
      type: 'draw_sandbox_tile',
      sessionId: 'session-1',
      playerId: 'p1',
      tileId: 'T_R1C2'
    });
  });

  it('rejects delete_session payloads without a session id', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'delete_session' }))
    );

    expect(result).toBeNull();
  });
});
