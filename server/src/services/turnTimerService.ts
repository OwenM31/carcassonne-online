/**
 * @description Session-scoped turn timers with timeout-driven automated turn actions.
 */
import type { Orientation, PlacementOption, ServerMessage, SessionId } from '@carcassonne/shared';
import { getLegalTilePlacements } from '@carcassonne/shared';

import type { SessionRecord, SessionService } from './sessionService';

const ACTIVE_TURN_PHASES = new Set(['draw_tile', 'place_tile', 'place_meeple']);

interface TurnTimerEntry {
  turnKey: string;
  activePlayerPresent: boolean;
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
    if (game.turnTimerSeconds === 0) {
      this.clearSession(sessionId);
      return;
    }

    const turnKey = buildTurnKey(game.turnNumber, game.activePlayerIndex, game.turnStartedAt);
    const activePlayerPresent = isActivePlayerPresent(session);
    const existing = this.timersBySession.get(sessionId);
    if (
      existing &&
      existing.turnKey === turnKey &&
      existing.activePlayerPresent === activePlayerPresent
    ) {
      return;
    }

    this.clearSession(sessionId);
    const delayMs = activePlayerPresent ? computeDelayMs(game.turnStartedAt, game.turnTimerSeconds) : 0;
    const timeout = setTimeout(() => this.handleTimeout(sessionId, turnKey), delayMs);
    this.timersBySession.set(sessionId, { turnKey, activePlayerPresent, timeout });
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

    const updated = runTimedOutTurn(session);
    if (!updated) {
      this.syncSession(sessionId);
      return;
    }

    this.sessionService.persist();
    this.broadcast({ type: 'game_state', sessionId, game: updated });
    this.syncSession(sessionId);
  }
}

function runTimedOutTurn(session: SessionRecord) {
  let game = session.gameService.getGame();
  if (!game || game.status !== 'active') {
    return null;
  }

  const activePlayer = game.players[game.activePlayerIndex];
  if (!activePlayer) {
    return null;
  }

  if (game.phase === 'draw_tile') {
    const drawResult = session.gameService.applyAction({ type: 'draw_tile', playerId: activePlayer.id });
    if (drawResult.type === 'error') {
      return null;
    }
    game = drawResult.game;
  }

  if (game.phase === 'place_tile') {
    const placement = chooseTimedPlacement(game);
    if (!placement || !game.currentTileId) {
      return null;
    }

    const placeResult = session.gameService.applyAction({
      type: 'place_tile',
      playerId: activePlayer.id,
      tileId: game.currentTileId,
      position: placement.position,
      orientation: placement.orientation
    });
    if (placeResult.type === 'error') {
      return null;
    }
    game = placeResult.game;
  }

  if (game.phase === 'place_meeple') {
    const skipResult = session.gameService.applyAction({
      type: 'skip_meeple',
      playerId: activePlayer.id
    });
    if (skipResult.type === 'error') {
      return null;
    }
    game = skipResult.game;
  }

  return game;
}

function chooseTimedPlacement(game: {
  board: Parameters<typeof getLegalTilePlacements>[0];
  currentTileId: string | null;
  currentTileOrientation: Orientation | null;
}): PlacementOption | null {
  if (!game.currentTileId) {
    return null;
  }

  const allOptions = getLegalTilePlacements(game.board, game.currentTileId);
  if (allOptions.length === 0) {
    return null;
  }

  const preferred = game.currentTileOrientation ?? randomOrientation();
  const optionsByPreferred = allOptions.filter((option) => option.orientation === preferred);
  if (optionsByPreferred.length > 0) {
    return pickRandom(optionsByPreferred);
  }

  const rotations = shuffleOrientations([0, 90, 180, 270]);
  for (const rotation of rotations) {
    const options = allOptions.filter((option) => option.orientation === rotation);
    if (options.length > 0) {
      return pickRandom(options);
    }
  }

  return pickRandom(allOptions);
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

function isActivePlayerPresent(session: SessionRecord): boolean {
  const game = session.gameService.getGame();
  if (!game) {
    return false;
  }

  const activePlayer = game.players[game.activePlayerIndex];
  if (!activePlayer) {
    return false;
  }

  return session
    .lobbyService
    .getState()
    .players
    .some((player) => player.id === activePlayer.id);
}

function shuffleOrientations(orientations: Orientation[]): Orientation[] {
  const values = [...orientations];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function randomOrientation(): Orientation {
  return pickRandom([0, 90, 180, 270]);
}

function pickRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}
