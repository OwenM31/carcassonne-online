import { createGame, toBoardKey, type GameSetup } from '../src';

describe('createGame', () => {
  it('initializes players and places the starting tile at the origin', () => {
    const setup: GameSetup = {
      gameId: 'game-1',
      seed: 'seed-1',
      startingTileId: 'START',
      tileDeck: ['A', 'START', 'B'],
      players: [
        { id: 'p1', name: 'Player 1', color: 'red' },
        { id: 'p2', name: 'Player 2', color: 'blue' }
      ]
    };

    const state = createGame(setup);

    expect(state.status).toBe('active');
    expect(state.phase).toBe('draw_tile');
    expect(state.activePlayerIndex).toBe(0);
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
        { id: 'p1', name: 'Player 1', color: 'red' },
        { id: 'p2', name: 'Player 2', color: 'blue' }
      ]
    };

    const state = createGame(setup);

    expect(state.tileDeck).toEqual(['A', 'B']);
  });
});
