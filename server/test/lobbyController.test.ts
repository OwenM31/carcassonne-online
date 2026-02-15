/**
 * @description Tests for lobby controller behaviors.
 */
import {
  buildTileDeck,
  createGame,
  getStartingTileCandidates,
  type GameActionResult,
  type GameState,
  type LobbyPlayer,
  type SessionDeckSize
} from '@carcassonne/shared';

import type { GameStartResult, GameService } from '../src/services/gameService';
import { createLobbyController } from '../src/controllers/lobbyController';
import { InMemoryLobbyService } from '../src/services/lobbyService';

class StubGameService implements GameService {
  resetCalls = 0;
  lastDeckSize: SessionDeckSize | null = null;
  private game: GameState | null;

  constructor(game: GameState | null = null) {
    this.game = game;
  }

  startGame(players: LobbyPlayer[], deckSize: SessionDeckSize = 'standard'): GameStartResult {
    this.lastDeckSize = deckSize;
    return { type: 'error', message: `Not implemented for ${players.length} players.` };
  }

  getGame() {
    return this.game;
  }

  reset() {
    this.resetCalls += 1;
    this.game = null;
  }

  applyAction(): GameActionResult {
    return { type: 'error', message: 'Not implemented.' };
  }

  undo(): GameActionResult {
    return { type: 'error', message: 'Not implemented.' };
  }
}

describe('createLobbyController', () => {
  it('resets the game when the last player leaves the lobby', () => {
    const lobbyService = new InMemoryLobbyService();
    const gameService = new StubGameService();
    const controller = createLobbyController('session-1', lobbyService, gameService);

    controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p1',
      playerName: 'Ada'
    });
    controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p2',
      playerName: 'Grace'
    });

    controller.handleMessage({ type: 'leave_lobby', sessionId: 'session-1', playerId: 'p1' });

    expect(gameService.resetCalls).toBe(0);

    controller.handleMessage({ type: 'leave_lobby', sessionId: 'session-1', playerId: 'p2' });

    expect(gameService.resetCalls).toBe(1);
  });

  it('resets the game when the last player disconnects', () => {
    const lobbyService = new InMemoryLobbyService();
    const gameService = new StubGameService();
    const controller = createLobbyController('session-1', lobbyService, gameService);

    controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p1',
      playerName: 'Ada'
    });

    controller.handleDisconnect('p1');

    expect(gameService.resetCalls).toBe(1);
  });

  it('resets the game when no active game players remain in the lobby', () => {
    const lobbyService = new InMemoryLobbyService();
    const gameService = new StubGameService(createTestGame());
    const controller = createLobbyController('session-1', lobbyService, gameService);

    controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p1',
      playerName: 'Ada'
    });
    controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p2',
      playerName: 'Grace'
    });
    controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p3',
      playerName: 'Linus'
    });

    controller.handleMessage({ type: 'leave_lobby', sessionId: 'session-1', playerId: 'p1' });

    expect(gameService.resetCalls).toBe(0);

    controller.handleMessage({ type: 'leave_lobby', sessionId: 'session-1', playerId: 'p2' });

    expect(gameService.resetCalls).toBe(1);
  });

  it('rejects new players when a game is in progress', () => {
    const lobbyService = new InMemoryLobbyService();
    const gameService = new StubGameService(createTestGame());
    const controller = createLobbyController('session-1', lobbyService, gameService);

    const response = controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p3',
      playerName: 'Linus'
    });

    expect(response).toEqual({ type: 'error', message: 'Game in progress.' });
    expect(lobbyService.getState().players).toHaveLength(0);
  });

  it('starts game with the configured session deck size', () => {
    const lobbyService = new InMemoryLobbyService();
    const gameService = new StubGameService();
    const controller = createLobbyController(
      'session-1',
      lobbyService,
      gameService,
      () => 'small'
    );

    controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p1',
      playerName: 'Ada'
    });
    controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p2',
      playerName: 'Grace'
    });

    controller.handleMessage({
      type: 'start_game',
      sessionId: 'session-1',
      playerId: 'p1'
    });

    expect(gameService.lastDeckSize).toBe('small');
  });
});

function createTestGame(): GameState {
  const startingTiles = getStartingTileCandidates();
  const startingTileId = startingTiles[0];

  if (!startingTileId) {
    throw new Error('Expected a starting tile.');
  }

  return createGame({
    gameId: 'game-1',
    players: [
      { id: 'p1', name: 'Ada', color: 'red' },
      { id: 'p2', name: 'Grace', color: 'blue' }
    ],
    tileDeck: buildTileDeck(),
    startingTileId
  });
}
