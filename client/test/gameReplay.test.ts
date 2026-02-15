/**
 * @description Unit tests for replay turn helper utilities.
 */
import { buildTileDeck, createGame, getStartingTileCandidates } from '@carcassonne/shared';

import { getCompletedTurnFromState, getSortedCompletedTurns } from '../src/state/gameReplay';

function createFixtureGame(gameId: string) {
  const [startingTileId] = getStartingTileCandidates();
  return createGame({
    gameId,
    players: [{ id: 'p1', name: 'Ada', color: 'red' }],
    tileDeck: buildTileDeck(),
    startingTileId
  });
}

describe('gameReplay helpers', () => {
  it('captures completed turns when a new draw phase starts', () => {
    const game = createFixtureGame('game-replay-1');

    game.turnNumber = 4;
    game.phase = 'draw_tile';
    game.currentTileId = null;

    expect(getCompletedTurnFromState(game)).toBe(3);
  });

  it('captures the final completed turn on game over states', () => {
    const game = createFixtureGame('game-replay-2');

    game.turnNumber = 7;
    game.phase = 'game_over';

    expect(getCompletedTurnFromState(game)).toBe(7);
  });

  it('sorts replay turns from oldest to newest', () => {
    const turns = getSortedCompletedTurns({
      5: createFixtureGame('game-replay-5'),
      2: createFixtureGame('game-replay-2b'),
      9: createFixtureGame('game-replay-9')
    });

    expect(turns).toEqual([2, 5, 9]);
  });
});
