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
import { analyzeBoardFeatures, countRiverTiles, hasAnyRiver } from '@carcassonne/shared';

export interface ScoreboardEntry {
  id: string;
  name: string;
  color: PlayerState['color'];
  score: number;
  meeplesAvailable: number;
  meeplesPlaced: number;
  meeplesTotal: number;
  bigMeepleAvailable: boolean;
  bigMeeplePlaced: boolean;
  abbotAvailable: boolean;
  abbotPlaced: boolean;
  isActive: boolean;
}

export interface GameHudState {
  activePlayer: PlayerState | null;
  phaseLabel: string;
  deckCount: number;
  riverDeckCount: number;
  currentTileId: TileId | null;
  scoreboard: ScoreboardEntry[];
  hasBigMeeples: boolean;
  hasAbbots: boolean;
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
  const hasBigMeeples = game.addons.includes('inns_and_cathedrals');
  const hasAbbots = game.addons.includes('abbot');
  const riverDeckCount = hasAnyRiver(game.addons) ? countRiverTiles(game.tileDeck) : 0;

  const scoreboard = game.players.map((player, index) => {
    const playerMeeples = game.meeples.filter((meeple) => meeple.playerId === player.id);
    const normalMeeplesPlaced = playerMeeples.filter((meeple) => meeple.kind === 'normal').length;
    const bigMeeplePlaced = playerMeeples.some((meeple) => meeple.kind === 'big');
    const abbotPlaced = playerMeeples.some((meeple) => meeple.kind === 'abbot');
    return {
      id: player.id,
      name: player.name,
      color: player.color,
      score: player.score,
      meeplesAvailable: player.meeplesAvailable,
      meeplesPlaced: normalMeeplesPlaced,
      meeplesTotal: player.meeplesAvailable + normalMeeplesPlaced,
      bigMeepleAvailable: player.bigMeepleAvailable,
      bigMeeplePlaced,
      abbotAvailable: player.abbotAvailable,
      abbotPlaced,
      isActive: index === game.activePlayerIndex
    };
  });

  return {
    activePlayer,
    phaseLabel: formatTurnPhase(game.phase),
    deckCount: game.tileDeck.length,
    riverDeckCount,
    currentTileId: game.currentTileId,
    scoreboard,
    hasBigMeeples,
    hasAbbots,
    featureCounter,
    eventLog: [...game.eventLog]
  };
}
