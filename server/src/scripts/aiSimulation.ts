/**
 * @description Core helpers for running headless AI-vs-AI match simulations.
 */
import {
  buildTileDeck,
  createGame,
  getStartingTileCandidates,
  shuffleTileDeck,
  type PlayerSetup,
  type SessionAiProfile,
  type SessionDeckSize,
  type SessionSummary
} from '@carcassonne/shared';

import { InMemoryGameService } from '../services/gameService';
import { InMemoryLobbyService } from '../services/lobbyService';
import type { SessionRecord, SessionService } from '../services/sessionService';
import { TurnTimerService } from '../services/turnTimerService';

export interface SimulationOptions {
  matches: number;
  deckSize: SessionDeckSize;
  maxTicks: number;
}

export interface SimulationStats {
  wins: Record<SessionAiProfile, number>;
  scoreTotals: Record<SessionAiProfile, number>;
  ties: number;
}

interface MatchResult {
  winner: SessionAiProfile | 'tie';
  scores: Record<SessionAiProfile, number>;
}

export async function runSimulation(options: SimulationOptions): Promise<SimulationStats> {
  const stats: SimulationStats = {
    wins: { randy: 0, martin: 0 },
    scoreTotals: { randy: 0, martin: 0 },
    ties: 0
  };

  for (let matchIndex = 0; matchIndex < options.matches; matchIndex += 1) {
    const result = await simulateMatch(matchIndex, options);
    stats.scoreTotals.randy += result.scores.randy;
    stats.scoreTotals.martin += result.scores.martin;

    if (result.winner === 'tie') {
      stats.ties += 1;
    } else {
      stats.wins[result.winner] += 1;
    }
  }

  return stats;
}

function createSimulationSession(matchIndex: number, deckSize: SessionDeckSize): SessionRecord {
  const startingTileId = getStartingTileCandidates()[0];
  if (!startingTileId) {
    throw new Error('No starting tile configured.');
  }

  const playerOrder: PlayerSetup[] =
    matchIndex % 2 === 0
      ? [
          { id: 'ai-randy-1', name: 'RANDY', color: 'red' },
          { id: 'ai-martin-1', name: 'MARTIN', color: 'blue' }
        ]
      : [
          { id: 'ai-martin-1', name: 'MARTIN', color: 'red' },
          { id: 'ai-randy-1', name: 'RANDY', color: 'blue' }
        ];

  const game = createGame({
    gameId: `sim-game-${matchIndex + 1}`,
    mode: 'standard',
    players: playerOrder,
    tileDeck: shuffleTileDeck(buildTileDeck(undefined, deckSize)),
    startingTileId,
    turnTimerSeconds: 0,
    seed: `sim-seed-${matchIndex + 1}`
  });

  const gameService = new InMemoryGameService(() => game.id, {
    game,
    history: [],
    startConfig: { deckSize, mode: 'standard', turnTimerSeconds: 0 }
  });
  const lobbyService = new InMemoryLobbyService();
  playerOrder.forEach((player) => lobbyService.join(player.id, player.name));

  return {
    id: `sim-session-${matchIndex + 1}`,
    deckSize,
    mode: 'standard',
    turnTimerSeconds: 0,
    takeoverBot: 'randy',
    aiPlayerIds: new Set(playerOrder.map((player) => player.id)),
    lobbyService,
    gameService
  };
}

async function simulateMatch(matchIndex: number, options: SimulationOptions): Promise<MatchResult> {
  const session = createSimulationSession(matchIndex, options.deckSize);
  const sessionService = buildSessionService(session);
  const timerService = new TurnTimerService({
    sessionService,
    broadcast: () => {}
  });

  timerService.syncSession(session.id);
  await waitForGameCompletion(session, options.maxTicks);
  timerService.dispose();

  const finalGame = session.gameService.getGame();
  if (!finalGame) {
    throw new Error(`Match ${matchIndex + 1} ended without a game state.`);
  }

  const scores: Record<SessionAiProfile, number> = { randy: 0, martin: 0 };
  finalGame.players.forEach((player) => {
    scores[inferProfile(player.id)] = player.score;
  });

  if (scores.randy === scores.martin) {
    return { winner: 'tie', scores };
  }

  return {
    winner: scores.randy > scores.martin ? 'randy' : 'martin',
    scores
  };
}

async function waitForGameCompletion(session: SessionRecord, maxTicks: number): Promise<void> {
  for (let tick = 0; tick < maxTicks; tick += 1) {
    const game = session.gameService.getGame();
    if (game?.status === 'finished') {
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  throw new Error(`Simulation exceeded max tick budget (${maxTicks}).`);
}

function buildSessionService(session: SessionRecord): SessionService {
  const buildSummary = (): SessionSummary => ({
    id: session.id,
    status: session.gameService.getGame() ? 'in_progress' : 'lobby',
    playerCount: session.lobbyService.getState().players.length,
    players: session.lobbyService.getState().players.map((player) => ({
      name: player.name,
      isAi: true,
      aiProfile: inferProfile(player.id)
    })),
    deckSize: session.deckSize,
    mode: session.mode,
    turnTimerSeconds: session.turnTimerSeconds,
    takeoverBot: session.takeoverBot
  });

  return {
    createSession: () => session,
    updateSessionDeckSize: () => ({ type: 'success', session }),
    updateSessionMode: () => ({ type: 'success', session }),
    updateSessionTurnTimer: () => ({ type: 'success', session }),
    updateSessionTakeoverBot: () => ({ type: 'success', session }),
    addAiPlayer: () => ({ type: 'success', session }),
    isAiPlayer: (_sessionId, playerId) => session.aiPlayerIds.has(playerId),
    getSession: (sessionId) => (sessionId === session.id ? session : null),
    listSessions: () => [buildSummary()],
    deleteSession: () => false,
    persist: () => {}
  };
}

function inferProfile(playerId: string): SessionAiProfile {
  return playerId.includes('martin') ? 'martin' : 'randy';
}
