import type {
  GameAction,
  GameActionResult,
  GameState,
  LobbyPlayer,
  PlayerColor,
  SessionDeckSize,
  SessionMode
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

export interface GameStartConfig {
  deckSize?: SessionDeckSize;
  mode?: SessionMode;
}

export interface GameService {
  startGame(players: LobbyPlayer[], config?: GameStartConfig): GameStartResult;
  getGame(): GameState | null;
  reset(): void;
  applyAction(action: GameAction): GameActionResult;
  undo(): GameActionResult;
  resetSandboxBoard(playerId: string): GameActionResult;
}

type GameIdFactory = () => string;

const defaultGameIdFactory: GameIdFactory = () =>
  `game-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export class InMemoryGameService implements GameService {
  private game: GameState | null = null;
  private history: GameState[] = [];
  private startConfig: Required<GameStartConfig> | null = null;
  private gameIdFactory: GameIdFactory;

  constructor(gameIdFactory: GameIdFactory = defaultGameIdFactory) {
    this.gameIdFactory = gameIdFactory;
  }

  startGame(players: LobbyPlayer[], config: GameStartConfig = {}): GameStartResult {
    const deckSize = config.deckSize ?? 'standard';
    const mode = config.mode ?? 'standard';

    if (this.game) {
      return { type: 'error', message: 'Game already started.' };
    }

    if (mode === 'standard' && players.length < 2) {
      return { type: 'error', message: 'At least 2 players are required to start.' };
    }

    if (mode === 'sandbox' && players.length < 1) {
      return { type: 'error', message: 'At least 1 player is required to start sandbox mode.' };
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
      mode,
      players: playerSetups,
      tileDeck: shuffleTileDeck(buildTileDeck(undefined, deckSize)),
      startingTileId: startingTiles[0]
    });

    this.game = game;
    this.history = [];
    this.startConfig = { deckSize, mode };

    return { type: 'success', game };
  }

  getGame(): GameState | null {
    return this.game;
  }

  reset() {
    this.game = null;
    this.history = [];
    this.startConfig = null;
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

  resetSandboxBoard(playerId: string): GameActionResult {
    if (!this.game) {
      return { type: 'error', message: 'No active game.' };
    }

    if (this.game.mode !== 'sandbox') {
      return { type: 'error', message: 'Sandbox board reset is only available in sandbox mode.' };
    }

    const activePlayer = this.game.players[this.game.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== playerId) {
      return { type: 'error', message: 'Only the active player can act.' };
    }

    const startingTiles = getStartingTileCandidates();
    const startingTileId = startingTiles[0];
    if (!startingTileId) {
      return { type: 'error', message: 'No starting tile configured.' };
    }

    const deckSize = this.startConfig?.deckSize ?? 'standard';
    const resetGame = createGame({
      gameId: this.game.id,
      mode: 'sandbox',
      players: this.game.players.map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color
      })),
      tileDeck: shuffleTileDeck(buildTileDeck(undefined, deckSize)),
      startingTileId
    });

    this.game = resetGame;
    this.history = [];
    return { type: 'success', game: resetGame };
  }
}
