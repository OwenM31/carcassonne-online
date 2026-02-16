/**
 * @description Tests for the in-memory session registry.
 */
import { InMemorySessionService } from '../src/services/sessionService';

describe('InMemorySessionService', () => {
  it('creates sessions and lists them with lobby status', () => {
    const service = new InMemorySessionService(() => 'session-1');

    service.createSession();

    expect(service.listSessions()).toEqual([
      {
        id: 'session-1',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
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
      players: [
        { name: 'Ada', color: 'black' },
        { name: 'Grace', color: 'red' }
      ],
      deckSize: 'standard',
      mode: 'standard',
      addons: [],
      tileCount: 71,
      turnTimerSeconds: 0,
      takeoverBot: 'randy'
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
      {
        id: 'session-4',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('updates session deck size before game start', () => {
    const service = new InMemorySessionService(() => 'session-5');
    service.createSession();

    const result = service.updateSessionDeckSize('session-5', 'small');

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-5',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'small',
        mode: 'standard',
        addons: [],
        tileCount: 43,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
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

  it('updates session mode before game start', () => {
    const service = new InMemorySessionService(() => 'session-7');
    service.createSession();

    const result = service.updateSessionMode('session-7', 'sandbox');

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-7',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'standard',
        mode: 'sandbox',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('rejects mode changes after game start', () => {
    const service = new InMemorySessionService(() => 'session-8');
    const session = service.createSession();

    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');
    session.gameService.startGame([
      { id: 'p1', name: 'Ada' },
      { id: 'p2', name: 'Grace' }
    ]);

    const result = service.updateSessionMode('session-8', 'sandbox');

    expect(result).toEqual({
      type: 'error',
      message: 'Cannot change session mode after game start.'
    });
  });

  it('updates session turn timer before game start', () => {
    const service = new InMemorySessionService(() => 'session-9');
    service.createSession();

    const result = service.updateSessionTurnTimer('session-9', 90);

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-9',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 90,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('updates session turn timer to unlimited before game start', () => {
    const service = new InMemorySessionService(() => 'session-9b');
    service.createSession();

    const result = service.updateSessionTurnTimer('session-9b', 0);

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-9b',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('rejects turn timer changes after game start', () => {
    const service = new InMemorySessionService(() => 'session-10');
    const session = service.createSession();

    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');
    session.gameService.startGame([
      { id: 'p1', name: 'Ada' },
      { id: 'p2', name: 'Grace' }
    ]);

    const result = service.updateSessionTurnTimer('session-10', 30);

    expect(result).toEqual({
      type: 'error',
      message: 'Cannot change turn timer after game start.'
    });
  });

  it('adds RANDY players before game start and labels them in summaries', () => {
    const service = new InMemorySessionService(() => 'session-11');
    service.createSession();

    const first = service.addAiPlayer('session-11', 'randy');
    const second = service.addAiPlayer('session-11', 'randy');

    expect(first.type).toBe('success');
    expect(second.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-11',
        status: 'lobby',
        playerCount: 2,
        players: [
          {
            name: 'RANDY',
            color: 'black',
            isAi: true,
            aiProfile: 'randy',
            aiPlayerId: 'ai-randy-1'
          },
          {
            name: 'RANDY 2',
            color: 'red',
            isAi: true,
            aiProfile: 'randy',
            aiPlayerId: 'ai-randy-2'
          }
        ],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('adds MARTIN players before game start and labels them in summaries', () => {
    const service = new InMemorySessionService(() => 'session-11b');
    service.createSession();

    const first = service.addAiPlayer('session-11b', 'martin');
    const second = service.addAiPlayer('session-11b', 'martin');

    expect(first.type).toBe('success');
    expect(second.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-11b',
        status: 'lobby',
        playerCount: 2,
        players: [
          {
            name: 'MARTIN',
            color: 'black',
            isAi: true,
            aiProfile: 'martin',
            aiPlayerId: 'ai-martin-1'
          },
          {
            name: 'MARTIN 2',
            color: 'red',
            isAi: true,
            aiProfile: 'martin',
            aiPlayerId: 'ai-martin-2'
          }
        ],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('adds JUAN players before game start and labels them in summaries', () => {
    const service = new InMemorySessionService(() => 'session-11d');
    service.createSession();

    const first = service.addAiPlayer('session-11d', 'juan');
    const second = service.addAiPlayer('session-11d', 'juan');

    expect(first.type).toBe('success');
    expect(second.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-11d',
        status: 'lobby',
        playerCount: 2,
        players: [
          {
            name: 'JUAN',
            color: 'black',
            isAi: true,
            aiProfile: 'juan',
            aiPlayerId: 'ai-juan-1'
          },
          {
            name: 'JUAN 2',
            color: 'red',
            isAi: true,
            aiProfile: 'juan',
            aiPlayerId: 'ai-juan-2'
          }
        ],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('updates takeover bot before game start', () => {
    const service = new InMemorySessionService(() => 'session-11c');
    service.createSession();

    const result = service.updateSessionTakeoverBot('session-11c', 'martin');

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-11c',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'martin'
      }
    ]);
  });

  it('updates takeover bot to JUAN before game start', () => {
    const service = new InMemorySessionService(() => 'session-11e');
    service.createSession();

    const result = service.updateSessionTakeoverBot('session-11e', 'juan');

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-11e',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'juan'
      }
    ]);
  });

  it('rejects AI additions after game start', () => {
    const service = new InMemorySessionService(() => 'session-12');
    const session = service.createSession();

    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');
    session.gameService.startGame([
      { id: 'p1', name: 'Ada' },
      { id: 'p2', name: 'Grace' }
    ]);

    const result = service.addAiPlayer('session-12', 'randy');
    expect(result).toEqual({
      type: 'error',
      message: 'Cannot add AI players after game start.'
    });
  });

  it('rejects takeover bot changes after game start', () => {
    const service = new InMemorySessionService(() => 'session-13');
    const session = service.createSession();

    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');
    session.gameService.startGame([
      { id: 'p1', name: 'Ada' },
      { id: 'p2', name: 'Grace' }
    ]);

    const result = service.updateSessionTakeoverBot('session-13', 'martin');
    expect(result).toEqual({
      type: 'error',
      message: 'Cannot change takeover bot after game start.'
    });
  });

  it('removes AI players before game start', () => {
    const service = new InMemorySessionService(() => 'session-14');
    service.createSession();
    service.addAiPlayer('session-14', 'randy');

    const result = service.removeAiPlayer('session-14', 'ai-randy-1');

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-14',
        status: 'lobby',
        playerCount: 0,
        players: [],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('rejects AI removal after game start', () => {
    const service = new InMemorySessionService(() => 'session-15');
    const session = service.createSession();
    service.addAiPlayer('session-15', 'martin');
    session.lobbyService.join('p1', 'Ada');
    session.gameService.startGame([
      { id: 'p1', name: 'Ada' },
      { id: 'ai-martin-1', name: 'MARTIN' }
    ]);

    const result = service.removeAiPlayer('session-15', 'ai-martin-1');

    expect(result).toEqual({
      type: 'error',
      message: 'Cannot remove AI players after game start.'
    });
  });

  it('allows players to change bot colors before game start', () => {
    const service = new InMemorySessionService(() => 'session-15a');
    const session = service.createSession();
    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');
    service.addAiPlayer('session-15a', 'randy');

    const result = service.updateSessionPlayerColor('session-15a', 'p1', 'ai-randy-1', 'green');

    expect(result.type).toBe('success');
    expect(service.listSessions()).toEqual([
      {
        id: 'session-15a',
        status: 'lobby',
        playerCount: 3,
        players: [
          { name: 'Ada', color: 'black' },
          { name: 'Grace', color: 'red' },
          {
            name: 'RANDY',
            color: 'green',
            isAi: true,
            aiProfile: 'randy',
            aiPlayerId: 'ai-randy-1'
          }
        ],
        deckSize: 'standard',
        mode: 'standard',
        addons: [],
        tileCount: 72,
        turnTimerSeconds: 0,
        takeoverBot: 'randy'
      }
    ]);
  });

  it('rejects changing another human player color', () => {
    const service = new InMemorySessionService(() => 'session-15b');
    const session = service.createSession();
    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');

    const result = service.updateSessionPlayerColor('session-15b', 'p1', 'p2', 'green');

    expect(result).toEqual({
      type: 'error',
      message: 'Only bot colors can be changed for other players.'
    });
  });

  it('marks the viewing player in personalized summaries', () => {
    const service = new InMemorySessionService(() => 'session-16');
    const session = service.createSession();
    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');

    const [summary] = service.listSessions('p2');

    expect(summary.players).toEqual([
      { name: 'Ada', color: 'black' },
      { name: 'Grace', color: 'red', isYou: true }
    ]);
  });
});
