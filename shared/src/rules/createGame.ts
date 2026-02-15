import { GameSetup, GameState, PlacedTile, PlayerState } from '../types/game';
import { createBoardWithTile } from './board';

const DEFAULT_MEEPLES = 7;

export function createGame(setup: GameSetup): GameState {
  const createdAt = new Date().toISOString();
  const players: PlayerState[] = setup.players.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    meeplesAvailable: player.meeplesAvailable ?? DEFAULT_MEEPLES,
    score: 0
  }));

  const tileDeck = [...setup.tileDeck];
  const startIndex = tileDeck.indexOf(setup.startingTileId);

  if (startIndex >= 0) {
    tileDeck.splice(startIndex, 1);
  }

  const startingTile: PlacedTile = {
    tileId: setup.startingTileId,
    position: { x: 0, y: 0 },
    orientation: 0
  };

  return {
    id: setup.gameId,
    mode: setup.mode ?? 'standard',
    status: 'active',
    phase: 'draw_tile',
    players,
    activePlayerIndex: 0,
    board: createBoardWithTile(startingTile),
    tileDeck,
    tileDiscard: [],
    currentTileId: null,
    currentTileOrientation: null,
    lastPlacedTile: null,
    meeples: [],
    eventLog: [
      {
        turn: 1,
        type: 'game_started',
        detail: `Starting tile ${setup.startingTileId} placed at 0,0.`,
        createdAt
      }
    ],
    startingTileId: setup.startingTileId,
    turnTimerSeconds: setup.turnTimerSeconds ?? 60,
    turnStartedAt: createdAt,
    turnNumber: 1,
    seed: setup.seed
  };
}
