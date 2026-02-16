import type {
  GameAction,
  GameActionResult,
  GameState,
  LobbyPlayer,
  PlayerColor,
  TileId,
  SessionAddon,
  SessionDeckSize,
  SessionMode,
  SessionTurnTimer
} from '@carcassonne/shared';
import {
  applyGameAction,
  buildTileDeck,
  createGame,
  getStartingTileCandidates,
  hasAnyRiver,
  hasRiver,
  hasRiver2,
  orderRiverDeckForStandard,
  RIVER_START_TILE_ID,
  RIVER_2_START_TILE_ID,
  shuffleTileDeck
} from '@carcassonne/shared';
import {
  cloneGameServiceSnapshot,
  type GameServiceSnapshot
} from './gameServiceSnapshot';
const PLAYER_COLORS: PlayerColor[] = ['black', 'red', 'yellow', 'green', 'blue', 'gray', 'pink'];
const MAX_GAME_PLAYERS = 6;

export type GameStartResult =
  | { type: 'success'; game: GameState }
  | { type: 'error'; message: string };

export interface GameStartConfig {
  deckSize?: SessionDeckSize;
  mode?: SessionMode;
  addons?: SessionAddon[];
  turnTimerSeconds?: SessionTurnTimer;
}

export interface GameService {
  startGame(players: LobbyPlayer[], config?: GameStartConfig): GameStartResult;
  getGame(): GameState | null;
  getSnapshot(): GameServiceSnapshot;
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

  constructor(
    gameIdFactory: GameIdFactory = defaultGameIdFactory,
    snapshot: GameServiceSnapshot | null = null
  ) {
    this.gameIdFactory = gameIdFactory;
    if (snapshot) {
      this.hydrate(snapshot);
    }
  }

  startGame(players: LobbyPlayer[], config: GameStartConfig = {}): GameStartResult {
    const deckSize = config.deckSize ?? 'standard';
    const mode = config.mode ?? 'standard';
    const addons = config.addons ?? [];
    const turnTimerSeconds = config.turnTimerSeconds ?? 0;

    if (this.game) {
      return { type: 'error', message: 'Game already started.' };
    }

    if (mode === 'standard' && players.length < 2) {
      return { type: 'error', message: 'At least 2 players are required to start.' };
    }

    if (mode === 'sandbox' && players.length < 1) {
      return { type: 'error', message: 'At least 1 player is required to start sandbox mode.' };
    }

    if (players.length > MAX_GAME_PLAYERS) {
      return { type: 'error', message: `Only ${MAX_GAME_PLAYERS} players are supported.` };
    }

    const startingTileId = chooseStartingTileId(mode, addons);
    if (!startingTileId) {
      return { type: 'error', message: 'No starting tile configured.' };
    }

    const playerSetups = players.map((player, index) => ({
      id: player.id,
      name: player.name,
      color: player.color ?? PLAYER_COLORS[index]
    }));

    const game = createGame({
      gameId: this.gameIdFactory(),
      mode,
      addons,
      players: playerSetups,
      tileDeck: buildGameDeck(deckSize, mode, addons),
      startingTileId,
      turnTimerSeconds
    });

    this.game = game;
    this.history = [];
    this.startConfig = { deckSize, mode, addons, turnTimerSeconds };

    return { type: 'success', game };
  }

  getGame(): GameState | null {
    return this.game;
  }

  getSnapshot(): GameServiceSnapshot {
    return cloneGameServiceSnapshot({
      game: this.game,
      history: this.history,
      startConfig: this.startConfig
    });
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

    const addons = this.startConfig?.addons ?? [];
    const startingTileId = chooseStartingTileId('sandbox', addons);
    if (!startingTileId) {
      return { type: 'error', message: 'No starting tile configured.' };
    }

    const deckSize = this.startConfig?.deckSize ?? 'standard';
    const turnTimerSeconds = this.startConfig?.turnTimerSeconds ?? 0;
    const resetGame = createGame({
      gameId: this.game.id,
      mode: 'sandbox',
      addons,
      players: this.game.players.map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color
      })),
      tileDeck: buildGameDeck(deckSize, 'sandbox', addons),
      startingTileId,
      turnTimerSeconds
    });

    this.game = resetGame;
    this.history = [];
    return { type: 'success', game: resetGame };
  }

  private hydrate(snapshot: GameServiceSnapshot): void {
    const next = cloneGameServiceSnapshot(snapshot);
    const timerSeconds = next.startConfig?.turnTimerSeconds ?? 0;
    this.game = next.game ? normalizeGameState(next.game, timerSeconds) : null;
    this.history = next.history.map((state) => normalizeGameState(state, timerSeconds));
    this.startConfig = next.startConfig
      ? {
          deckSize: next.startConfig.deckSize,
          mode: next.startConfig.mode,
          addons: next.startConfig.addons ?? [],
          turnTimerSeconds: timerSeconds
        }
      : null;
  }
}

function chooseStartingTileId(
  mode: SessionMode,
  addons: SessionAddon[]
): TileId | null {
  if (mode === 'standard' && hasRiver2(addons)) {
    return RIVER_2_START_TILE_ID;
  }
  if (mode === 'standard' && hasRiver(addons)) {
    return RIVER_START_TILE_ID;
  }

  const startingTiles = getStartingTileCandidates(undefined, addons);
  return startingTiles[0] ?? null;
}

function buildGameDeck(
  deckSize: SessionDeckSize,
  mode: SessionMode,
  addons: SessionAddon[]
) {
  const shuffledDeck = shuffleTileDeck(buildTileDeck(undefined, deckSize, addons));
  if (mode === 'standard' && hasAnyRiver(addons)) {
    return orderRiverDeckForStandard(shuffledDeck, addons);
  }

  return shuffledDeck;
}

function normalizeGameState(game: GameState, timerSeconds: SessionTurnTimer): GameState {
  return {
    ...game,
    addons: game.addons ?? [],
    players: game.players.map((player) => ({
      ...player,
      bigMeepleAvailable: player.bigMeepleAvailable ?? false,
      abbotAvailable:
        player.abbotAvailable ?? (game.addons ?? []).includes('abbot')
    })),
    meeples: game.meeples.map((meeple) => ({
      ...meeple,
      kind: meeple.kind ?? 'normal'
    })),
    currentTileOrientation: game.currentTileOrientation ?? null,
    turnTimerSeconds: game.turnTimerSeconds ?? timerSeconds,
    turnStartedAt: game.turnStartedAt ?? new Date().toISOString()
  };
}
