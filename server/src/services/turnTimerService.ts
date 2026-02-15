/**
 * @description Session-scoped turn timers with timeout-driven automated turn actions.
 */
import type {
  BoardState,
  Coordinate,
  GameState,
  MeeplePlacement,
  Orientation,
  PlacementOption,
  PlayerId,
  ServerMessage,
  SessionAiProfile,
  SessionId
} from '@carcassonne/shared';
import {
  applyGameAction,
  getLegalMeeplePlacements,
  getLegalTilePlacements
} from '@carcassonne/shared';

import type { SessionRecord, SessionService } from './sessionService';

const ACTIVE_TURN_PHASES = new Set(['draw_tile', 'place_tile', 'place_meeple']);

interface TurnTimerEntry {
  turnKey: string;
  automationStrategy: AutomationStrategy;
  timeout: ReturnType<typeof setTimeout>;
}

type AutomationStrategy = 'timeout' | SessionAiProfile;

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

function runAutomatedTurn(session: SessionRecord, strategy: AutomationStrategy) {
  let game = session.gameService.getGame();
  if (!game || game.status !== 'active') {
    return null;
  }

  let activePlayer = game.players[game.activePlayerIndex];
  if (!activePlayer) {
    return null;
  }

  if (game.phase === 'draw_tile') {
    const drawResult = session.gameService.applyAction({ type: 'draw_tile', playerId: activePlayer.id });
    if (drawResult.type === 'error') {
      return null;
    }
    game = drawResult.game;
    activePlayer = game.players[game.activePlayerIndex];
    if (!activePlayer) {
      return null;
    }
  }

  if (game.phase === 'place_tile') {
    const placement = choosePlacementForStrategy(game, activePlayer.id, strategy);
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
    activePlayer = game.players[game.activePlayerIndex];
    if (!activePlayer) {
      return null;
    }
  }

  if (game.phase === 'place_meeple') {
    if (strategy === 'timeout') {
      const skipResult = session.gameService.applyAction({
        type: 'skip_meeple',
        playerId: activePlayer.id
      });
      if (skipResult.type === 'error') {
        return null;
      }
      game = skipResult.game;
      return game;
    }

    const placement =
      strategy === 'martin'
        ? chooseMartinMeeplePlacement(game, activePlayer.id)
        : chooseRandyMeeplePlacement(game);
    const result = placement
      ? session.gameService.applyAction({
          type: 'place_meeple',
          playerId: activePlayer.id,
          placement
        })
      : session.gameService.applyAction({ type: 'skip_meeple', playerId: activePlayer.id });
    if (result.type === 'error') {
      return null;
    }
    game = result.game;
  }

  return game;
}

function choosePlacementForStrategy(
  game: GameState,
  playerId: PlayerId,
  strategy: AutomationStrategy
): PlacementOption | null {
  if (strategy === 'timeout') {
    return chooseTimedPlacement(game);
  }
  if (strategy === 'martin') {
    return chooseMartinPlacement(game, playerId);
  }
  return chooseRandyPlacement(game);
}

function chooseTimedPlacement(game: {
  board: BoardState;
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

function chooseRandyPlacement(game: {
  board: BoardState;
  currentTileId: string | null;
}): PlacementOption | null {
  if (!game.currentTileId) {
    return null;
  }

  const allOptions = getLegalTilePlacements(game.board, game.currentTileId);
  if (allOptions.length === 0) {
    return null;
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

function chooseMartinPlacement(
  game: GameState,
  playerId: PlayerId
): PlacementOption | null {
  const candidates = evaluatePlacementCandidates(game, playerId);
  if (candidates.length === 0) {
    if (!game.currentTileId) {
      return null;
    }
    const options = getLegalTilePlacements(game.board, game.currentTileId);
    return options.length > 0 ? pickRandom(options) : null;
  }

  const tieSeed = buildTieSeed(game, playerId, 'place');
  const best = pickBestCandidate(candidates, tieSeed);
  return best?.value ?? null;
}

function evaluatePlacementCandidates(
  game: GameState,
  playerId: PlayerId
): RankedCandidate<PlacementOption>[] {
  if (!game.currentTileId) {
    return [];
  }

  const allOptions = getLegalTilePlacements(game.board, game.currentTileId);
  const ranked: RankedCandidate<PlacementOption>[] = [];
  allOptions.forEach((option) => {
    const placeResult = applyGameAction(game, {
      type: 'place_tile',
      playerId,
      tileId: game.currentTileId ?? '',
      position: option.position,
      orientation: option.orientation
    });
    if (placeResult.type === 'error') {
      return;
    }

    const afterPlacement = placeResult.game;
    const meepleDecision = evaluateMartinMeepleChoice(afterPlacement, playerId);
    if (!meepleDecision) {
      return;
    }

    const meepleOptionCount = getLegalMeeplePlacements(afterPlacement).length;
    const adjacencyScore = countAdjacentTiles(game.board, option.position) * 3;
    const projectedScore = meepleDecision.score + (meepleDecision.scoreDelta ?? 0) * 20;
    ranked.push({
      value: option,
      key: `${option.position.x},${option.position.y},${option.orientation}`,
      score: projectedScore + adjacencyScore + meepleOptionCount * 2
    });
  });

  return ranked;
}

function chooseRandyMeeplePlacement(game: GameState) {
  const placements = getLegalMeeplePlacements(game);
  const choiceCount = placements.length + 1;
  const selectedIndex = Math.floor(Math.random() * choiceCount);
  if (selectedIndex === 0) {
    return null;
  }

  return placements[selectedIndex - 1] ?? null;
}

function chooseMartinMeeplePlacement(
  game: GameState,
  playerId: PlayerId
): MeeplePlacement | null {
  const choice = evaluateMartinMeepleChoice(game, playerId);
  return choice?.value ?? null;
}

function evaluateMartinMeepleChoice(
  game: GameState,
  playerId: PlayerId
): RankedCandidate<MeeplePlacement | null> | null {
  const playerBefore = game.players.find((player) => player.id === playerId);
  if (!playerBefore) {
    return null;
  }

  const legalPlacements = getLegalMeeplePlacements(game);
  const ranked: RankedCandidate<MeeplePlacement | null>[] = [];
  const options = [null, ...legalPlacements];
  options.forEach((option) => {
    const result = applyGameAction(
      game,
      option
        ? { type: 'place_meeple', playerId, placement: option }
        : { type: 'skip_meeple', playerId }
    );
    if (result.type === 'error') {
      return;
    }

    const playerAfter = result.game.players.find((player) => player.id === playerId);
    if (!playerAfter) {
      return;
    }

    const scoreDelta = playerAfter.score - playerBefore.score;
    const usesMeeple = option !== null;
    let score = scoreDelta * 100;
    if (usesMeeple) {
      score += 10;
      if (scoreDelta >= 3) {
        score += 15;
      }
      if (playerAfter.meeplesAvailable <= 2 && scoreDelta < 2) {
        score -= 25;
      }
    } else if (legalPlacements.length > 0) {
      score -= 5;
    }

    ranked.push({
      value: option,
      key: option ? meeplePlacementKey(option) : 'none',
      score,
      scoreDelta
    });
  });

  if (ranked.length === 0) {
    return null;
  }

  return pickBestCandidate(ranked, buildTieSeed(game, playerId, 'meeple'));
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

interface RankedCandidate<T> {
  value: T;
  score: number;
  key: string;
  scoreDelta?: number;
}

function pickBestCandidate<T>(
  candidates: RankedCandidate<T>[],
  tieSeed: string
): RankedCandidate<T> | null {
  let best: RankedCandidate<T> | null = null;
  let bestTieScore = Number.NEGATIVE_INFINITY;
  candidates.forEach((candidate) => {
    if (!best || candidate.score > best.score) {
      best = candidate;
      bestTieScore = tieBreakScore(tieSeed, candidate.key);
      return;
    }

    if (candidate.score < best.score) {
      return;
    }

    const tieScore = tieBreakScore(tieSeed, candidate.key);
    if (tieScore > bestTieScore) {
      best = candidate;
      bestTieScore = tieScore;
    }
  });

  return best;
}

function buildTieSeed(
  game: { seed?: string; id: string; turnNumber: number },
  playerId: PlayerId,
  channel: 'place' | 'meeple'
): string {
  return `${game.seed ?? game.id}:${channel}:${game.turnNumber}:${playerId}`;
}

function tieBreakScore(seed: string, key: string): number {
  const value = `${seed}:${key}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function countAdjacentTiles(board: BoardState, position: Coordinate): number {
  const neighbors = [
    { x: position.x, y: position.y - 1 },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x - 1, y: position.y }
  ];

  return neighbors.reduce((count, neighbor) => {
    return board.tiles[coordinateKey(neighbor)] ? count + 1 : count;
  }, 0);
}

function coordinateKey(position: Coordinate): string {
  return `${position.x},${position.y}`;
}

function meeplePlacementKey(placement: MeeplePlacement): string {
  return [
    placement.tilePosition.x,
    placement.tilePosition.y,
    placement.featureType,
    placement.featureIndex
  ].join(':');
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
