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
  type SessionDeckSize
} from '@carcassonne/shared';

import { InMemoryGameService } from '../services/gameService';
import { InMemoryLobbyService } from '../services/lobbyService';
import type { SessionRecord } from '../services/sessionService';
import { TurnTimerService } from '../services/turnTimerService';
import {
  createProfileScoreMap,
  formatAiProfileName,
  inferProfileFromPlayerId,
  resolveSimulationProfilePair,
  type SimulationProfilePair
} from './aiSimulationProfiles';
import { buildSimulationSessionService } from './aiSimulationSessionService';

export interface SimulationOptions {
  matches: number;
  deckSize: SessionDeckSize;
  maxTicks: number;
  firstProfile?: SessionAiProfile;
  secondProfile?: SessionAiProfile;
}

export interface SimulationStats {
  profiles: SimulationProfilePair;
  wins: Record<SessionAiProfile, number>;
  scoreTotals: Record<SessionAiProfile, number>;
  ties: number;
}

interface MatchResult {
  winner: SessionAiProfile | 'tie';
  scores: Record<SessionAiProfile, number>;
}

export async function runSimulation(options: SimulationOptions): Promise<SimulationStats> {
  const profiles = resolveSimulationProfilePair(options);
  const stats: SimulationStats = {
    profiles,
    wins: createProfileScoreMap(),
    scoreTotals: createProfileScoreMap(),
    ties: 0
  };

  for (let matchIndex = 0; matchIndex < options.matches; matchIndex += 1) {
    const result = await simulateMatch(matchIndex, options, profiles);
    stats.scoreTotals[profiles.first] += result.scores[profiles.first];
    stats.scoreTotals[profiles.second] += result.scores[profiles.second];

    if (result.winner === 'tie') {
      stats.ties += 1;
    } else {
      stats.wins[result.winner] += 1;
    }
  }

  return stats;
}

function createSimulationSession(
  matchIndex: number,
  deckSize: SessionDeckSize,
  profiles: SimulationProfilePair
): SessionRecord {
  const startingTileId = getStartingTileCandidates()[0];
  if (!startingTileId) {
    throw new Error('No starting tile configured.');
  }

  const playerOrder: PlayerSetup[] =
    matchIndex % 2 === 0
      ? [
          buildAiPlayer(profiles.first, 'yellow'),
          buildAiPlayer(profiles.second, 'green')
        ]
      : [
          buildAiPlayer(profiles.second, 'yellow'),
          buildAiPlayer(profiles.first, 'green')
        ];

  const game = createGame({
    gameId: `sim-game-${matchIndex + 1}`,
    mode: 'standard',
    addons: [],
    players: playerOrder,
    tileDeck: shuffleTileDeck(buildTileDeck(undefined, deckSize)),
    startingTileId,
    turnTimerSeconds: 0,
    seed: `sim-seed-${matchIndex + 1}`
  });

  const gameService = new InMemoryGameService(() => game.id, {
    game,
    history: [],
    startConfig: { deckSize, mode: 'standard', addons: [], turnTimerSeconds: 0 }
  });
  const lobbyService = new InMemoryLobbyService();
  playerOrder.forEach((player) => lobbyService.join(player.id, player.name));

  return {
    id: `sim-session-${matchIndex + 1}`,
    deckSize,
    mode: 'standard',
    addons: [],
    turnTimerSeconds: 0,
    takeoverBot: 'randy',
    aiPlayerIds: new Set(playerOrder.map((player) => player.id)),
    lobbyService,
    gameService
  };
}

function buildAiPlayer(profile: SessionAiProfile, color: PlayerSetup['color']): PlayerSetup {
  return {
    id: `ai-${profile}-1`,
    name: formatAiProfileName(profile),
    color
  };
}

async function simulateMatch(
  matchIndex: number,
  options: SimulationOptions,
  profiles: SimulationProfilePair
): Promise<MatchResult> {
  const session = createSimulationSession(matchIndex, options.deckSize, profiles);
  const sessionService = buildSimulationSessionService(session);
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

  const scores = createProfileScoreMap();
  finalGame.players.forEach((player) => {
    scores[inferProfileFromPlayerId(player.id)] = player.score;
  });

  if (scores[profiles.first] === scores[profiles.second]) {
    return { winner: 'tie', scores };
  }

  return {
    winner: scores[profiles.first] > scores[profiles.second] ? profiles.first : profiles.second,
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
