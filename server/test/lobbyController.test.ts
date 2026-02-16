/**
 * @description Tests for lobby controller behaviors.
 */
import {
  buildTileDeck,
  createGame,
  getStartingTileCandidates,
  type GameState,
  type LobbyPlayer,
  type SessionDeckSize,
  type SessionMode,
  type GameActionResult,
} from '@carcassonne/shared';

import type { GameStartConfig, GameStartResult, GameService } from '../src/services/gameService';
import type { GameServiceSnapshot } from '../src/services/gameServiceSnapshot';
import { createLobbyController } from '../src/controllers/lobbyController';
import { InMemoryLobbyService } from '../src/services/lobbyService';

class StubGameService implements GameService {
  resetCalls = 0;
  lastDeckSize: SessionDeckSize | null = null;
  lastMode: SessionMode | null = null;
  private game: GameState | null;

  constructor(game: GameState | null = null) {
    this.game = game;
  }

  startGame(players: LobbyPlayer[], config: GameStartConfig = {}): GameStartResult {
    this.lastDeckSize = config.deckSize ?? 'standard';
    this.lastMode = config.mode ?? 'standard';
    return { type: 'error', message: `Not implemented for ${players.length} players.` };
  }

  getGame() {
    return this.game;
  }

  getSnapshot(): GameServiceSnapshot {
    return { game: this.game, history: [], startConfig: null };
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

  resetSandboxBoard(): GameActionResult {
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

  it('does not reset an active game when players disconnect', () => {
    const lobbyService = new InMemoryLobbyService();
    lobbyService.join('p1', 'Ada', '1234');
    lobbyService.join('p2', 'Grace', '5678');
    lobbyService.lockGameRejoinPins(['p1', 'p2']);
    const gameService = new StubGameService(createTestGame());
    const controller = createLobbyController('session-1', lobbyService, gameService);

    controller.handleDisconnect('p1');
    controller.handleDisconnect('p2');

    expect(gameService.resetCalls).toBe(0);
  });

  it('keeps active games running when game players leave the lobby', () => {
    const lobbyService = new InMemoryLobbyService();
    lobbyService.join('p1', 'Ada', '1234');
    lobbyService.join('p2', 'Grace', '5678');
    lobbyService.join('p3', 'Linus');
    lobbyService.lockGameRejoinPins(['p1', 'p2']);

    const gameService = new StubGameService(createTestGame());
    const controller = createLobbyController('session-1', lobbyService, gameService);

    controller.handleMessage({ type: 'leave_lobby', sessionId: 'session-1', playerId: 'p1' });

    expect(gameService.resetCalls).toBe(0);

    controller.handleMessage({ type: 'leave_lobby', sessionId: 'session-1', playerId: 'p2' });

    expect(gameService.resetCalls).toBe(0);
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

  it('starts game with the configured session options', () => {
    const lobbyService = new InMemoryLobbyService();
    const gameService = new StubGameService();
    const controller = createLobbyController(
      'session-1',
      lobbyService,
      gameService,
      () => ({ deckSize: 'small', mode: 'sandbox', addons: [], turnTimerSeconds: 90 })
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
    expect(gameService.lastMode).toBe('sandbox');
  });

  it('rejects rejoin for active players with incorrect PIN', () => {
    const lobbyService = new InMemoryLobbyService();
    lobbyService.join('p1', 'Ada', '1234');
    lobbyService.lockGameRejoinPins(['p1']);

    const gameService = new StubGameService(createTestGame());
    const controller = createLobbyController('session-1', lobbyService, gameService);

    const response = controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p1',
      playerName: 'Ada',
      playerPin: '9999'
    });

    expect(response).toEqual({ type: 'error', message: 'Incorrect passkey.' });
  });

  it('rejects rejoin for active players who never set a PIN', () => {
    const lobbyService = new InMemoryLobbyService();
    lobbyService.join('p1', 'Ada');
    lobbyService.lockGameRejoinPins(['p1']);

    const gameService = new StubGameService(createTestGame());
    const controller = createLobbyController('session-1', lobbyService, gameService);

    const response = controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p1',
      playerName: 'Ada'
    });

    expect(response).toEqual({
      type: 'error',
      message: 'Rejoin is unavailable because no PIN was set.'
    });
  });

  it('allows rejoin for active players with matching PIN', () => {
    const lobbyService = new InMemoryLobbyService();
    lobbyService.join('p1', 'Ada', '1234');
    lobbyService.lockGameRejoinPins(['p1']);

    const gameService = new StubGameService(createTestGame());
    const controller = createLobbyController('session-1', lobbyService, gameService);

    const response = controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'p1',
      playerName: 'Ada',
      playerPin: '1234'
    });

    expect(response.type).toBe('game_state');
  });

  it('adds AI seats through lobby actions', () => {
    const lobbyService = new InMemoryLobbyService();
    const gameService = new StubGameService();
    const addAiPlayer = jest.fn(() => ({
      type: 'success' as const,
      lobby: {
        players: [
          { id: 'ai-randy-1', name: 'RANDY' }
        ]
      }
    }));
    const controller = createLobbyController(
      'session-1',
      lobbyService,
      gameService,
      undefined,
      addAiPlayer
    );

    const response = controller.handleMessage({
      type: 'add_ai_player',
      sessionId: 'session-1'
    });

    expect(addAiPlayer).toHaveBeenCalledWith('randy');
    expect(response).toEqual({
      type: 'lobby_state',
      sessionId: 'session-1',
      lobby: { players: [{ id: 'ai-randy-1', name: 'RANDY' }] }
    });
  });

  it('removes AI seats through lobby actions', () => {
    const lobbyService = new InMemoryLobbyService();
    const gameService = new StubGameService();
    const removeAiPlayer = jest.fn(() => ({
      type: 'success' as const,
      lobby: { players: [] }
    }));
    const controller = createLobbyController(
      'session-1',
      lobbyService,
      gameService,
      undefined,
      undefined,
      removeAiPlayer
    );

    const response = controller.handleMessage({
      type: 'remove_ai_player',
      sessionId: 'session-1',
      aiPlayerId: 'ai-randy-1'
    });

    expect(removeAiPlayer).toHaveBeenCalledWith('ai-randy-1');
    expect(response).toEqual({
      type: 'lobby_state',
      sessionId: 'session-1',
      lobby: { players: [] }
    });
  });

  it('rejects manual joins for AI seats', () => {
    const controller = createLobbyController(
      'session-1',
      new InMemoryLobbyService(),
      new StubGameService(),
      undefined,
      undefined,
      undefined,
      (playerId) => playerId.startsWith('ai-randy-')
    );

    const response = controller.handleMessage({
      type: 'join_lobby',
      sessionId: 'session-1',
      playerId: 'ai-randy-1',
      playerName: 'Attempt'
    });

    expect(response).toEqual({ type: 'error', message: 'AI seats cannot be joined manually.' });
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
      { id: 'p1', name: 'Ada', color: 'yellow' },
      { id: 'p2', name: 'Grace', color: 'green' }
    ],
    tileDeck: buildTileDeck(),
    startingTileId
  });
}
