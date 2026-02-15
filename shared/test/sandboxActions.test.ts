/**
 * @description Unit tests for sandbox-specific game actions.
 */
import { applyGameAction, createGame, type GameSetup } from '../src';

describe('sandbox actions', () => {
  it('rejects sandbox tile selection in standard mode', () => {
    const setup: GameSetup = {
      gameId: 'standard-mode',
      startingTileId: 'T_R3C4',
      tileDeck: ['T_R2C8', 'T_R1C2'],
      players: [
        { id: 'p1', name: 'Ada', color: 'red' },
        { id: 'p2', name: 'Linus', color: 'blue' }
      ]
    };
    const state = createGame(setup);

    const result = applyGameAction(state, {
      type: 'draw_sandbox_tile',
      playerId: 'p1',
      tileId: 'T_R1C2'
    });

    expect(result).toEqual({
      type: 'error',
      message: 'Sandbox tile selection is only available in sandbox mode.'
    });
  });

  it('draws a selected tile from anywhere in the remaining deck', () => {
    const setup: GameSetup = {
      gameId: 'sandbox-mode',
      mode: 'sandbox',
      startingTileId: 'T_R3C4',
      tileDeck: ['T_R2C8', 'T_R1C2'],
      players: [{ id: 'p1', name: 'Ada', color: 'red' }]
    };
    const state = createGame(setup);

    const result = applyGameAction(state, {
      type: 'draw_sandbox_tile',
      playerId: 'p1',
      tileId: 'T_R1C2'
    });

    if (result.type !== 'success') {
      throw new Error('Expected draw_sandbox_tile to succeed.');
    }

    expect(result.game.phase).toBe('place_tile');
    expect(result.game.currentTileId).toBe('T_R1C2');
    expect(result.game.tileDeck).toEqual(['T_R2C8']);
    const latestEvent = result.game.eventLog[result.game.eventLog.length - 1];
    expect(latestEvent?.detail).toContain('selected T_R1C2');
  });

  it('rejects unavailable sandbox tile selections', () => {
    const setup: GameSetup = {
      gameId: 'sandbox-missing-tile',
      mode: 'sandbox',
      startingTileId: 'T_R3C4',
      tileDeck: ['T_R2C8'],
      players: [{ id: 'p1', name: 'Ada', color: 'red' }]
    };
    const state = createGame(setup);

    const result = applyGameAction(state, {
      type: 'draw_sandbox_tile',
      playerId: 'p1',
      tileId: 'T_R1C2'
    });

    expect(result).toEqual({
      type: 'error',
      message: 'Selected tile is not available in the deck.'
    });
  });
});
