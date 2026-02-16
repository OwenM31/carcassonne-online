import { createGame, toBoardKey, type GameSetup } from '../src';

describe('createGame', () => {
  it('initializes players and places the starting tile at the origin', () => {
    const setup: GameSetup = {
      gameId: 'game-1',
      seed: 'seed-1',
      startingTileId: 'START',
      tileDeck: ['A', 'START', 'B'],
      players: [
        { id: 'p1', name: 'Player 1', color: 'yellow' },
        { id: 'p2', name: 'Player 2', color: 'green' }
      ]
    };

    const state = createGame(setup);

    expect(state.mode).toBe('standard');
    expect(state.status).toBe('active');
    expect(state.phase).toBe('draw_tile');
    expect(state.activePlayerIndex).toBe(0);
    expect(state.turnTimerSeconds).toBe(0);
    expect(state.currentTileOrientation).toBeNull();
    expect(typeof state.turnStartedAt).toBe('string');
    expect(state.players).toHaveLength(2);
    expect(state.players[0].meeplesAvailable).toBe(7);
    expect(state.board.tiles[toBoardKey({ x: 0, y: 0 })].tileId).toBe('START');
  });

  it('removes the starting tile from the deck if present', () => {
    const setup: GameSetup = {
      gameId: 'game-2',
      startingTileId: 'START',
      tileDeck: ['A', 'START', 'B'],
      players: [
        { id: 'p1', name: 'Player 1', color: 'yellow' },
        { id: 'p2', name: 'Player 2', color: 'green' }
      ]
    };

    const state = createGame(setup);

    expect(state.tileDeck).toEqual(['A', 'B']);
  });

  it('uses sandbox mode when requested', () => {
    const setup: GameSetup = {
      gameId: 'game-3',
      mode: 'sandbox',
      startingTileId: 'START',
      tileDeck: ['A', 'START', 'B'],
      players: [{ id: 'p1', name: 'Player 1', color: 'yellow' }]
    };

    const state = createGame(setup);

    expect(state.mode).toBe('sandbox');
  });

  it('uses the configured turn timer when provided', () => {
    const setup: GameSetup = {
      gameId: 'game-4',
      mode: 'sandbox',
      startingTileId: 'START',
      tileDeck: ['A', 'START', 'B'],
      turnTimerSeconds: 90,
      players: [{ id: 'p1', name: 'Player 1', color: 'yellow' }]
    };

    const state = createGame(setup);

    expect(state.turnTimerSeconds).toBe(90);
  });

  it('supports unlimited turn timer when configured', () => {
    const setup: GameSetup = {
      gameId: 'game-5',
      mode: 'sandbox',
      startingTileId: 'START',
      tileDeck: ['A', 'START', 'B'],
      turnTimerSeconds: 0,
      players: [{ id: 'p1', name: 'Player 1', color: 'yellow' }]
    };

    const state = createGame(setup);

    expect(state.turnTimerSeconds).toBe(0);
  });

  it('initializes abbot availability when the add-on is enabled', () => {
    const setup: GameSetup = {
      gameId: 'game-6',
      addons: ['abbot'],
      startingTileId: 'START',
      tileDeck: ['A', 'START', 'B'],
      players: [{ id: 'p1', name: 'Player 1', color: 'yellow' }]
    };

    const state = createGame(setup);

    expect(state.players[0].abbotAvailable).toBe(true);
  });
});
