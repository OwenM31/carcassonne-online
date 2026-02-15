import type {
  GameAction,
  GameActionResult,
  GameState,
  LobbyPlayer,
  PlayerColor,
  SessionDeckSize
} from '@carcassonne/shared';
import {
  applyGameAction,
  buildTileDeck,
  createGame,
  getStartingTileCandidates,
  shuffleTileDeck
} from '@carcassonne/shared';

const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'black'];

export type GameStartResult =
  | { type: 'success'; game: GameState }
  | { type: 'error'; message: string };

export interface GameService {
  startGame(players: LobbyPlayer[], deckSize?: SessionDeckSize): GameStartResult;
  getGame(): GameState | null;
  reset(): void;
  applyAction(action: GameAction): GameActionResult;
  undo(): GameActionResult;
}

type GameIdFactory = () => string;

const defaultGameIdFactory: GameIdFactory = () =>
  `game-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export class InMemoryGameService implements GameService {
  private game: GameState | null = null;
  private history: GameState[] = [];
  private gameIdFactory: GameIdFactory;

  constructor(gameIdFactory: GameIdFactory = defaultGameIdFactory) {
    this.gameIdFactory = gameIdFactory;
  }

  startGame(players: LobbyPlayer[], deckSize: SessionDeckSize = 'standard'): GameStartResult {
    if (this.game) {
      return { type: 'error', message: 'Game already started.' };
    }

    if (players.length < 2) {
      return { type: 'error', message: 'At least 2 players are required to start.' };
    }

    if (players.length > PLAYER_COLORS.length) {
      return { type: 'error', message: `Only ${PLAYER_COLORS.length} players are supported.` };
    }

    const startingTiles = getStartingTileCandidates();
    if (startingTiles.length === 0) {
      return { type: 'error', message: 'No starting tile configured.' };
    }

    const playerSetups = players.map((player, index) => ({
      id: player.id,
      name: player.name,
      color: PLAYER_COLORS[index]
    }));

    const game = createGame({
      gameId: this.gameIdFactory(),
      players: playerSetups,
      tileDeck: shuffleTileDeck(buildTileDeck(undefined, deckSize)),
      startingTileId: startingTiles[0]
    });

    this.game = game;
    this.history = [];

    return { type: 'success', game };
  }

  getGame(): GameState | null {
    return this.game;
  }

  reset() {
    this.game = null;
    this.history = [];
  }

  applyAction(action: GameAction): GameActionResult {
    if (!this.game) {
      return { type: 'error', message: 'No active game.' };
    }

    const result = applyGameAction(this.game, action);

    if (result.type === 'success') {
      this.history.push(this.game);
      this.game = result.game;
    }

    return result;
  }

  undo(): GameActionResult {
    if (!this.game) {
      return { type: 'error', message: 'No active game.' };
    }

    const previous = this.history.pop();
    if (!previous) {
      return { type: 'error', message: 'Nothing to undo.' };
    }

    this.game = previous;
    return { type: 'success', game: previous };
  }
}
