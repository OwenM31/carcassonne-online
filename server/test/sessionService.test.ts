/**
 * @description Tests for the in-memory session registry.
 */
import { InMemorySessionService } from '../src/services/sessionService';

describe('InMemorySessionService', () => {
  it('creates sessions and lists them with lobby status', () => {
    const service = new InMemorySessionService(() => 'session-1');

    service.createSession();

    expect(service.listSessions()).toEqual([
      { id: 'session-1', status: 'lobby', playerCount: 0 }
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
      playerCount: 2
    });
  });
});
