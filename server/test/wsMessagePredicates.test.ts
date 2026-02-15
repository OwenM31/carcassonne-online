/**
 * @description Tests for websocket message predicate helpers.
 */
import {
  hasPlayerId,
  requiresBoundPlayer,
  shouldRefreshSessions
} from '../src/transports/wsMessagePredicates';

describe('wsMessagePredicates', () => {
  it('detects player-scoped messages', () => {
    expect(
      hasPlayerId({
        type: 'draw_tile',
        sessionId: 'session-1',
        playerId: 'p1'
      })
    ).toBe(true);

    expect(
      hasPlayerId({
        type: 'set_session_mode',
        sessionId: 'session-1',
        mode: 'sandbox'
      })
    ).toBe(false);
  });

  it('requires bound identity for player actions other than join', () => {
    expect(
      requiresBoundPlayer({
        type: 'draw_tile',
        sessionId: 'session-1',
        playerId: 'p1'
      })
    ).toBe(true);

    expect(
      requiresBoundPlayer({
        type: 'join_lobby',
        sessionId: 'session-1',
        playerId: 'p1',
        playerName: 'Ada'
      })
    ).toBe(false);
  });

  it('refreshes session list for lobby membership changes', () => {
    expect(
      shouldRefreshSessions({
        type: 'join_lobby',
        sessionId: 'session-1',
        playerId: 'p1',
        playerName: 'Ada'
      })
    ).toBe(true);

    expect(
      shouldRefreshSessions({
        type: 'draw_tile',
        sessionId: 'session-1',
        playerId: 'p1'
      })
    ).toBe(false);
  });
});
