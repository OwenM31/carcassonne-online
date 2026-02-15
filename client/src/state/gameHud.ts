/**
 * @description Derives view state for the game HUD.
 */
import type {
  FeatureCounter,
  GameEvent,
  GameState,
  PlayerState,
  TurnPhase,
  TileId
} from '@carcassonne/shared';
import { analyzeBoardFeatures } from '@carcassonne/shared';

export interface ScoreboardEntry {
  id: string;
  name: string;
  color: PlayerState['color'];
  score: number;
  meeplesAvailable: number;
  meeplesPlaced: number;
  meeplesTotal: number;
  isActive: boolean;
}

export interface GameHudState {
  activePlayer: PlayerState | null;
  phaseLabel: string;
  deckCount: number;
  currentTileId: TileId | null;
  scoreboard: ScoreboardEntry[];
  featureCounter: FeatureCounter;
  eventLog: GameEvent[];
}

const PHASE_LABELS: Record<TurnPhase, string> = {
  setup: 'Setup',
  draw_tile: 'Draw tile',
  place_tile: 'Place tile',
  place_meeple: 'Place meeple',
  scoring: 'Scoring',
  game_over: 'Game over'
};

export function formatTurnPhase(phase: TurnPhase): string {
  return PHASE_LABELS[phase] ?? phase;
}

export function getActivePlayer(game: GameState): PlayerState | null {
  return game.players[game.activePlayerIndex] ?? null;
}

export function buildGameHudState(game: GameState): GameHudState {
  const activePlayer = getActivePlayer(game);
  const featureCounter = analyzeBoardFeatures(game.board).summary;

  const scoreboard = game.players.map((player, index) => {
    const meeplesPlaced = game.meeples.filter((meeple) => meeple.playerId === player.id).length;
    return {
      id: player.id,
      name: player.name,
      color: player.color,
      score: player.score,
      meeplesAvailable: player.meeplesAvailable,
      meeplesPlaced,
      meeplesTotal: player.meeplesAvailable + meeplesPlaced,
      isActive: index === game.activePlayerIndex
    };
  });

  return {
    activePlayer,
    phaseLabel: formatTurnPhase(game.phase),
    deckCount: game.tileDeck.length,
    currentTileId: game.currentTileId,
    scoreboard,
    featureCounter,
    eventLog: [...game.eventLog]
  };
}
