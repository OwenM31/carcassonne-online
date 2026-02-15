/**
 * @description Session-scoped turn timers with timeout-driven automated turn actions.
 */
import type {
  PlayerId,
  ServerMessage,
  SessionAiProfile,
  SessionId
} from '@carcassonne/shared';

import type { SessionRecord, SessionService } from './sessionService';
import {
  type AutomationStrategy,
  runAutomatedTurn
} from './turnTimerAutomation';

const ACTIVE_TURN_PHASES = new Set(['draw_tile', 'place_tile', 'place_meeple']);

interface TurnTimerEntry {
  turnKey: string;
  automationStrategy: AutomationStrategy;
  timeout: ReturnType<typeof setTimeout>;
}

interface TurnTimerServiceOptions {
  sessionService: SessionService;
  broadcast: (message: ServerMessage) => void;
}

export class TurnTimerService {
  private sessionService: SessionService;
  private broadcast: (message: ServerMessage) => void;
  private timersBySession = new Map<SessionId, TurnTimerEntry>();

  constructor({ sessionService, broadcast }: TurnTimerServiceOptions) {
    this.sessionService = sessionService;
    this.broadcast = broadcast;
  }

  syncAllSessions(): void {
    this.sessionService.listSessions().forEach((summary) => this.syncSession(summary.id));
  }

  syncSession(sessionId: SessionId): void {
    const session = this.sessionService.getSession(sessionId);
    const game = session?.gameService.getGame();
    if (!session || !game || game.status !== 'active' || !ACTIVE_TURN_PHASES.has(game.phase)) {
      this.clearSession(sessionId);
      return;
    }

    const turnKey = buildTurnKey(game.turnNumber, game.activePlayerIndex, game.turnStartedAt);
    const strategy = resolveAutomationStrategy(session);
    if (strategy === 'timeout' && game.turnTimerSeconds === 0) {
      this.clearSession(sessionId);
      return;
    }

    const existing = this.timersBySession.get(sessionId);
    if (
      existing &&
      existing.turnKey === turnKey &&
      existing.automationStrategy === strategy
    ) {
      return;
    }

    this.clearSession(sessionId);
    const delayMs =
      strategy === 'timeout'
        ? computeDelayMs(game.turnStartedAt, game.turnTimerSeconds)
        : 0;
    const timeout = setTimeout(() => this.handleTimeout(sessionId, turnKey), delayMs);
    this.timersBySession.set(sessionId, {
      turnKey,
      automationStrategy: strategy,
      timeout
    });
  }

  clearSession(sessionId: SessionId): void {
    const entry = this.timersBySession.get(sessionId);
    if (!entry) {
      return;
    }

    clearTimeout(entry.timeout);
    this.timersBySession.delete(sessionId);
  }

  dispose(): void {
    this.timersBySession.forEach((entry) => clearTimeout(entry.timeout));
    this.timersBySession.clear();
  }

  private handleTimeout(sessionId: SessionId, turnKey: string): void {
    this.timersBySession.delete(sessionId);
    const session = this.sessionService.getSession(sessionId);
    const game = session?.gameService.getGame();
    if (!session || !game || game.status !== 'active') {
      return;
    }

    const latestTurnKey = buildTurnKey(game.turnNumber, game.activePlayerIndex, game.turnStartedAt);
    if (latestTurnKey !== turnKey) {
      this.syncSession(sessionId);
      return;
    }

    const strategy = resolveAutomationStrategy(session);
    const updated = runAutomatedTurn(session, strategy);
    if (!updated) {
      this.syncSession(sessionId);
      return;
    }

    this.sessionService.persist();
    this.broadcast({ type: 'game_state', sessionId, game: updated });
    this.syncSession(sessionId);
  }
}

function buildTurnKey(turnNumber: number, activePlayerIndex: number, turnStartedAt: string): string {
  return `${turnNumber}:${activePlayerIndex}:${turnStartedAt}`;
}

function computeDelayMs(turnStartedAt: string, turnTimerSeconds: number): number {
  const turnStart = Number(new Date(turnStartedAt));
  const fallbackDelay = turnTimerSeconds * 1000;
  if (!Number.isFinite(turnStart)) {
    return fallbackDelay;
  }

  const delay = turnStart + turnTimerSeconds * 1000 - Date.now();
  return Math.max(0, delay);
}

function resolveAutomationStrategy(session: SessionRecord): AutomationStrategy {
  const game = session.gameService.getGame();
  if (!game) {
    return 'timeout';
  }

  const activePlayer = game.players[game.activePlayerIndex];
  if (!activePlayer) {
    return 'timeout';
  }

  const isPresent = isPlayerPresent(session, activePlayer.id);
  if (session.aiPlayerIds.has(activePlayer.id)) {
    return inferAiProfileFromPlayerId(activePlayer.id) ?? session.takeoverBot;
  }

  if (!isPresent) {
    return session.takeoverBot;
  }

  return 'timeout';
}

function isPlayerPresent(session: SessionRecord, playerId: PlayerId): boolean {
  return session
    .lobbyService
    .getState()
    .players
    .some((player) => player.id === playerId);
}

function inferAiProfileFromPlayerId(playerId: PlayerId): SessionAiProfile | null {
  if (playerId.startsWith('ai-randy-')) {
    return 'randy';
  }

  if (playerId.startsWith('ai-martin-')) {
    return 'martin';
  }

  return null;
}
