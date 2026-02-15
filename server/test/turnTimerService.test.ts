/**
 * @description Tests for timeout-driven automated turn handling.
 */
import {
  createGame,
  getStartingTileCandidates,
  type SessionSummary,
  type SessionTurnTimer
} from '@carcassonne/shared';

import { InMemoryGameService } from '../src/services/gameService';
import { InMemoryLobbyService } from '../src/services/lobbyService';
import { TurnTimerService } from '../src/services/turnTimerService';
import type { SessionRecord, SessionService } from '../src/services/sessionService';

describe('TurnTimerService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('auto-plays a timed-out turn and broadcasts updated game state', () => {
    const session = buildSandboxSession(true);
    const persist = jest.fn();
    const sessionService = buildSessionService(session, persist);
    const broadcast = jest.fn();
    const service = new TurnTimerService({ sessionService, broadcast });

    service.syncSession(session.id);
    jest.advanceTimersByTime(29_000);
    expect(broadcast).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(1_000);

    expect(persist).toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledTimes(1);
    const message = broadcast.mock.calls[0][0] as { type: string; game: { eventLog: Array<{ type: string }> } };
    expect(message.type).toBe('game_state');
    expect(message.game.eventLog.some((entry) => entry.type === 'draw_tile')).toBe(true);
    expect(message.game.eventLog.some((entry) => entry.type === 'place_tile')).toBe(true);
    expect(message.game.eventLog.some((entry) => entry.type === 'skip_meeple')).toBe(true);
  });

  it('auto-plays immediately when the active player is disconnected from lobby presence', () => {
    const session = buildSandboxSession(false);
    const persist = jest.fn();
    const sessionService = buildSessionService(session, persist);
    const broadcast = jest.fn();
    const service = new TurnTimerService({ sessionService, broadcast });

    service.syncSession(session.id);
    jest.runOnlyPendingTimers();

    expect(persist).toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  it('reschedules to immediate timeout when the active player leaves mid-turn', () => {
    const session = buildSandboxSession(true);
    const persist = jest.fn();
    const sessionService = buildSessionService(session, persist);
    const broadcast = jest.fn();
    const service = new TurnTimerService({ sessionService, broadcast });

    service.syncSession(session.id);
    session.lobbyService.leave('p1');
    service.syncSession(session.id);
    jest.advanceTimersByTime(1);

    expect(persist).toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  it('reschedules to the remaining turn delay when the active player rejoins', () => {
    const session = buildSandboxSession(false);
    const persist = jest.fn();
    const sessionService = buildSessionService(session, persist);
    const broadcast = jest.fn();
    const service = new TurnTimerService({ sessionService, broadcast });

    service.syncSession(session.id);
    session.lobbyService.join('p1', 'Ada');
    service.syncSession(session.id);
    jest.advanceTimersByTime(1);

    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(29_000);
    expect(broadcast).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(1_000);
    expect(persist).toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  it('does not auto-play when the session timer is unlimited', () => {
    const session = buildSandboxSession(true, 0);
    const persist = jest.fn();
    const sessionService = buildSessionService(session, persist);
    const broadcast = jest.fn();
    const service = new TurnTimerService({ sessionService, broadcast });

    service.syncSession(session.id);
    jest.advanceTimersByTime(300_000);

    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledTimes(0);
  });

  it('auto-plays unlimited turns for configured AI seats', () => {
    const session = buildSandboxSession(true, 0, true);
    const persist = jest.fn();
    const sessionService = buildSessionService(session, persist);
    const broadcast = jest.fn();
    const service = new TurnTimerService({ sessionService, broadcast });

    service.syncSession(session.id);
    jest.runOnlyPendingTimers();

    expect(persist).toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledTimes(1);
    const message = broadcast.mock.calls[0][0] as {
      type: string;
      game: { eventLog: Array<{ type: string }> };
    };
    expect(message.game.eventLog.some((entry) => entry.type === 'draw_tile')).toBe(true);
    expect(message.game.eventLog.some((entry) => entry.type === 'place_tile')).toBe(true);
    expect(
      message.game.eventLog.some(
        (entry) => entry.type === 'place_meeple' || entry.type === 'skip_meeple'
      )
    ).toBe(true);
  });
});

function buildSandboxSession(
  includeActivePlayerInLobby: boolean,
  turnTimerSeconds: SessionTurnTimer = 30,
  markActivePlayerAsAi = false
): SessionRecord {
  const startingTileId = getStartingTileCandidates()[0];
  if (!startingTileId) {
    throw new Error('Expected a configured starting tile.');
  }

  const game = createGame({
    gameId: 'game-timeout',
    mode: 'sandbox',
    players: [{ id: 'p1', name: 'Ada', color: 'red' }],
    tileDeck: ['T_R1C1'],
    startingTileId,
    turnTimerSeconds
  });
  const gameService = new InMemoryGameService(() => 'game-timeout', {
    game,
    history: [],
    startConfig: { deckSize: 'standard', mode: 'sandbox', turnTimerSeconds }
  });

  const lobbyService = new InMemoryLobbyService();
  if (includeActivePlayerInLobby) {
    lobbyService.join('p1', 'Ada');
  }

  return {
    id: 'session-1',
    deckSize: 'standard',
    mode: 'sandbox',
    turnTimerSeconds,
    aiPlayerIds: markActivePlayerAsAi ? new Set(['p1']) : new Set(),
    lobbyService,
    gameService
  };
}

function buildSessionService(session: SessionRecord, persist: () => void): SessionService {
  const summary: SessionSummary = {
    id: session.id,
    status: 'in_progress',
    playerCount: 1,
    players: [{ name: 'Ada' }],
    deckSize: session.deckSize,
    mode: session.mode,
    turnTimerSeconds: session.turnTimerSeconds
  };

  return {
    createSession: () => session,
    updateSessionDeckSize: () => ({ type: 'success', session }),
    updateSessionMode: () => ({ type: 'success', session }),
    updateSessionTurnTimer: () => ({ type: 'success', session }),
    addAiPlayer: () => ({ type: 'success', session }),
    isAiPlayer: (_sessionId: string, playerId: string) => session.aiPlayerIds.has(playerId),
    getSession: (sessionId: string) => (sessionId === session.id ? session : null),
    listSessions: () => [summary],
    deleteSession: () => false,
    persist
  };
}
