/**
 * @description Tests for lobby state reducers.
 */
import { applyLobbyMessage, initialLobbyViewState } from '../src/state/lobbyState';

describe('applyLobbyMessage', () => {
  it('updates the lobby on lobby_state', () => {
    const lobby = { players: [{ id: 'p1', name: 'Ada' }] };
    const result = applyLobbyMessage(initialLobbyViewState, {
      type: 'lobby_state',
      sessionId: 'session-1',
      lobby
    }, 'session-1');

    expect(result.lobby).toEqual(lobby);
    expect(result.error).toBeNull();
  });

  it('ignores lobby_state from other sessions', () => {
    const lobby = { players: [{ id: 'p1', name: 'Ada' }] };
    const result = applyLobbyMessage(initialLobbyViewState, {
      type: 'lobby_state',
      sessionId: 'session-2',
      lobby
    }, 'session-1');

    expect(result.lobby).toBeNull();
  });

  it('preserves lobby and sets error on error', () => {
    const lobby = { players: [{ id: 'p1', name: 'Ada' }] };
    const seeded = { ...initialLobbyViewState, lobby, error: null };
    const result = applyLobbyMessage(seeded, {
      type: 'error',
      message: 'Oops'
    }, 'session-1');

    expect(result.lobby).toEqual(lobby);
    expect(result.error).toBe('Oops');
  });

  it('replaces sessions on session_list', () => {
    const seeded = { ...initialLobbyViewState, sessions: [] };
    const result = applyLobbyMessage(seeded, {
      type: 'session_list',
      sessions: [{ id: 'session-1', status: 'lobby', playerCount: 0 }]
    }, null);

    expect(result.sessions).toEqual([
      { id: 'session-1', status: 'lobby', playerCount: 0 }
    ]);
  });
});
