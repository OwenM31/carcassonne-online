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

  it('parses create_session payloads with turn timer', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'create_session', turnTimerSeconds: 90 }))
    );

    expect(result).toEqual({ type: 'create_session', turnTimerSeconds: 90 });
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

  it('parses set_session_turn_timer payloads', () => {
    const result = parseClientMessage(
      Buffer.from(
        JSON.stringify({
          type: 'set_session_turn_timer',
          sessionId: 'session-1',
          turnTimerSeconds: 30
        })
      )
    );

    expect(result).toEqual({
      type: 'set_session_turn_timer',
      sessionId: 'session-1',
      turnTimerSeconds: 30
    });
  });

  it('parses join_lobby payloads with optional PIN', () => {
    const result = parseClientMessage(
      Buffer.from(
        JSON.stringify({
          type: 'join_lobby',
          sessionId: 'session-1',
          playerId: 'p1',
          playerName: 'Ada',
          playerPin: '1234'
        })
      )
    );

    expect(result).toEqual({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p1',
      playerName: 'Ada',
      playerPin: '1234'
    });
  });

  it('parses delete_session payloads', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'delete_session', sessionId: 'session-1' }))
    );

    expect(result).toEqual({ type: 'delete_session', sessionId: 'session-1' });
  });

  it('parses reset_sandbox_board payloads', () => {
    const result = parseClientMessage(
      Buffer.from(
        JSON.stringify({
          type: 'reset_sandbox_board',
          sessionId: 'session-1',
          playerId: 'p1'
        })
      )
    );

    expect(result).toEqual({
      type: 'reset_sandbox_board',
      sessionId: 'session-1',
      playerId: 'p1'
    });
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

  it('parses set_tile_orientation payloads', () => {
    const result = parseClientMessage(
      Buffer.from(
        JSON.stringify({
          type: 'set_tile_orientation',
          sessionId: 'session-1',
          playerId: 'p1',
          orientation: 270
        })
      )
    );

    expect(result).toEqual({
      type: 'set_tile_orientation',
      sessionId: 'session-1',
      playerId: 'p1',
      orientation: 270
    });
  });

  it('rejects delete_session payloads without a session id', () => {
    const result = parseClientMessage(
      Buffer.from(JSON.stringify({ type: 'delete_session' }))
    );

    expect(result).toBeNull();
  });

  it('rejects invalid turn timer values', () => {
    const result = parseClientMessage(
      Buffer.from(
        JSON.stringify({
          type: 'set_session_turn_timer',
          sessionId: 'session-1',
          turnTimerSeconds: 45
        })
      )
    );

    expect(result).toBeNull();
  });
});
