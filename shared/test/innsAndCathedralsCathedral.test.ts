/**
 * @description Cathedral-specific scoring coverage for Inns and Cathedrals.
 */
import { applyGameAction, createGame, type GameActionResult, type GameSetup } from '../src';

function expectSuccess(result: GameActionResult, label: string) {
  if (result.type !== 'success') {
    throw new Error(`${label} failed: ${result.message}`);
  }
  return result.game;
}

describe('inns and cathedrals cathedral scoring', () => {
  it('triples completed city scoring when a cathedral is part of the city', () => {
    const setup: GameSetup = {
      gameId: 'ic-cathedral-city',
      addons: ['inns_and_cathedrals'],
      startingTileId: 'T_R3C4',
      tileDeck: ['IC_R1C2', 'T_R2C8', 'T_R2C8', 'T_R2C8'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    };
    const state = createGame(setup);

    const drawOne = expectSuccess(applyGameAction(state, { type: 'draw_tile', playerId: 'p1' }), 'draw one');
    const placeOne = expectSuccess(
      applyGameAction(drawOne, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: 'IC_R1C2',
        position: { x: 0, y: 1 },
        orientation: 0
      }),
      'place one'
    );
    const meepleOne = expectSuccess(
      applyGameAction(placeOne, {
        type: 'place_meeple',
        playerId: 'p1',
        placement: { tilePosition: { x: 0, y: 1 }, featureType: 'city', featureIndex: 0 }
      }),
      'meeple one'
    );
    const drawTwo = expectSuccess(applyGameAction(meepleOne, { type: 'draw_tile', playerId: 'p1' }), 'draw two');
    const placeTwo = expectSuccess(
      applyGameAction(drawTwo, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: 'T_R2C8',
        position: { x: 0, y: 2 },
        orientation: 180
      }),
      'place two'
    );
    const skipTwo = expectSuccess(applyGameAction(placeTwo, { type: 'skip_meeple', playerId: 'p1' }), 'skip two');
    const drawThree = expectSuccess(applyGameAction(skipTwo, { type: 'draw_tile', playerId: 'p1' }), 'draw three');
    const placeThree = expectSuccess(
      applyGameAction(drawThree, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: 'T_R2C8',
        position: { x: 1, y: 1 },
        orientation: 270
      }),
      'place three'
    );
    const skipThree = expectSuccess(
      applyGameAction(placeThree, { type: 'skip_meeple', playerId: 'p1' }),
      'skip three'
    );
    const drawFour = expectSuccess(applyGameAction(skipThree, { type: 'draw_tile', playerId: 'p1' }), 'draw four');
    const placeFour = expectSuccess(
      applyGameAction(drawFour, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: 'T_R2C8',
        position: { x: -1, y: 1 },
        orientation: 90
      }),
      'place four'
    );
    const skipFour = expectSuccess(
      applyGameAction(placeFour, { type: 'skip_meeple', playerId: 'p1' }),
      'skip four'
    );

    expect(skipFour.phase).toBe('game_over');
    expect(skipFour.status).toBe('finished');
    expect(skipFour.players[0].score).toBe(15);
    expect(skipFour.players[0].meeplesAvailable).toBe(7);
    expect(skipFour.meeples).toHaveLength(0);
  });
});
