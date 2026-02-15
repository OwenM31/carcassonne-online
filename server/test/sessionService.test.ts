/**
 * @description Tests for the in-memory session registry.
 */
import { InMemorySessionService } from '../src/services/sessionService';

describe('InMemorySessionService', () => {
  it('creates sessions and lists them with lobby status', () => {
    const service = new InMemorySessionService(() => 'session-1');

    service.createSession();

    expect(service.listSessions()).toEqual([
      { id: 'session-1', status: 'lobby', playerCount: 0, deckSize: 'standard' }
    ]);
  });

  it('marks sessions as in progress after a game starts', () => {
    const service = new InMemorySessionService(() => 'session-2');
    const session = service.createSession();

    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');

    session.gameService.startGame([
      { id: 'p1', name: 'Ada' },
      { id: 'p2', name: 'Grace' }
    ]);

    const [summary] = service.listSessions();

    expect(summary).toEqual({
      id: 'session-2',
      status: 'in_progress',
      playerCount: 2,
      deckSize: 'standard'
    });
  });

  it('deletes sessions from the registry', () => {
    const ids = ['session-3', 'session-4'];
    const service = new InMemorySessionService(() => ids.shift() ?? 'session-fallback');
    service.createSession();
    service.createSession();

    const deleted = service.deleteSession('session-3');
    const missing = service.deleteSession('session-404');

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
    expect(service.listSessions()).toEqual([
      { id: 'session-4', status: 'lobby', playerCount: 0, deckSize: 'standard' }
    ]);
  });

  it('updates session deck size before game start', () => {
    const service = new InMemorySessionService(() => 'session-5');
    service.createSession();

    const result = service.updateSessionDeckSize('session-5', 'small');

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      { id: 'session-5', status: 'lobby', playerCount: 0, deckSize: 'small' }
    ]);
  });

  it('rejects deck size changes after game start', () => {
    const service = new InMemorySessionService(() => 'session-6');
    const session = service.createSession();

    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');
    session.gameService.startGame([
      { id: 'p1', name: 'Ada' },
      { id: 'p2', name: 'Grace' }
    ]);

    const result = service.updateSessionDeckSize('session-6', 'small');

    expect(result).toEqual({
      type: 'error',
      message: 'Cannot change deck size after game start.'
    });
  });
});
