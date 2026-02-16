/**
 * @description Integration tests for Inns and Cathedrals gameplay rules.
 */
import { applyGameAction, createGame, getLegalTilePlacements, type GameActionResult, type GameSetup } from '../src';

function expectSuccess(result: GameActionResult, label: string) {
  if (result.type !== 'success') {
    throw new Error(`${label} failed: ${result.message}`);
  }
  return result.game;
}

describe('inns and cathedrals', () => {
  it('allows a single big meeple placement when the add-on is enabled', () => {
    const setup: GameSetup = {
      gameId: 'ic-big-meeple',
      addons: ['inns_and_cathedrals'],
      startingTileId: 'T_R3C4',
      tileDeck: ['T_R1C1', 'T_R1C1'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    };
    const state = createGame(setup);

    const drawOne = expectSuccess(applyGameAction(state, { type: 'draw_tile', playerId: 'p1' }), 'draw one');
    if (!drawOne.currentTileId) {
      throw new Error('Expected a tile after first draw.');
    }
    const firstPlacement = getLegalTilePlacements(drawOne.board, drawOne.currentTileId)[0];
    const placeOne = expectSuccess(
      applyGameAction(drawOne, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: drawOne.currentTileId,
        position: firstPlacement.position,
        orientation: firstPlacement.orientation
      }),
      'place one'
    );
    const placeBig = expectSuccess(
      applyGameAction(placeOne, {
        type: 'place_meeple',
        playerId: 'p1',
        kind: 'big',
        placement: { tilePosition: firstPlacement.position, featureType: 'monastery', featureIndex: 0 }
      }),
      'place big meeple'
    );
    expect(placeBig.players[0].bigMeepleAvailable).toBe(false);
    expect(placeBig.players[0].meeplesAvailable).toBe(7);
    expect(placeBig.meeples[0].kind).toBe('big');

    const drawTwo = expectSuccess(applyGameAction(placeBig, { type: 'draw_tile', playerId: 'p1' }), 'draw two');
    if (!drawTwo.currentTileId) {
      throw new Error('Expected a tile after second draw.');
    }
    const secondPlacement = getLegalTilePlacements(drawTwo.board, drawTwo.currentTileId)[0];
    const placeTwo = expectSuccess(
      applyGameAction(drawTwo, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: drawTwo.currentTileId,
        position: secondPlacement.position,
        orientation: secondPlacement.orientation
      }),
      'place two'
    );
    const secondBig = applyGameAction(placeTwo, {
      type: 'place_meeple',
      playerId: 'p1',
      kind: 'big',
      placement: { tilePosition: secondPlacement.position, featureType: 'monastery', featureIndex: 0 }
    });

    expect(secondBig).toEqual({ type: 'error', message: 'Big meeple is not available.' });
  });

  it('doubles completed road scoring when an inn is present', () => {
    const setup: GameSetup = {
      gameId: 'ic-inn-road-complete',
      addons: ['inns_and_cathedrals'],
      startingTileId: 'T_R3C4',
      tileDeck: ['IC_R2C3', 'T_R1C2'],
      players: [
        { id: 'p1', name: 'Ada', color: 'yellow' },
        { id: 'p2', name: 'Linus', color: 'green' }
      ]
    };
    const state = createGame(setup);

    const drawP1 = expectSuccess(applyGameAction(state, { type: 'draw_tile', playerId: 'p1' }), 'draw p1');
    const placeP1 = expectSuccess(
      applyGameAction(drawP1, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: 'IC_R2C3',
        position: { x: -1, y: 0 },
        orientation: 270
      }),
      'place p1'
    );
    const meepleP1 = expectSuccess(
      applyGameAction(placeP1, {
        type: 'place_meeple',
        playerId: 'p1',
        placement: { tilePosition: { x: -1, y: 0 }, featureType: 'road', featureIndex: 0 }
      }),
      'meeple p1'
    );
    const drawP2 = expectSuccess(applyGameAction(meepleP1, { type: 'draw_tile', playerId: 'p2' }), 'draw p2');
    const placeP2 = expectSuccess(
      applyGameAction(drawP2, {
        type: 'place_tile',
        playerId: 'p2',
        tileId: 'T_R1C2',
        position: { x: 1, y: 0 },
        orientation: 90
      }),
      'place p2'
    );
    const skipP2 = expectSuccess(applyGameAction(placeP2, { type: 'skip_meeple', playerId: 'p2' }), 'skip p2');
    const p1 = skipP2.players.find((player) => player.id === 'p1');

    expect(skipP2.phase).toBe('game_over');
    expect(skipP2.status).toBe('finished');
    expect(p1?.score).toBe(6);
    expect(p1?.meeplesAvailable).toBe(7);
    expect(skipP2.meeples).toHaveLength(0);
  });

  it('awards zero points for incomplete inn roads in final scoring', () => {
    const setup: GameSetup = {
      gameId: 'ic-inn-road-incomplete',
      addons: ['inns_and_cathedrals'],
      startingTileId: 'T_R3C4',
      tileDeck: ['IC_R2C3'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    };
    const state = createGame(setup);

    const draw = expectSuccess(applyGameAction(state, { type: 'draw_tile', playerId: 'p1' }), 'draw');
    const place = expectSuccess(
      applyGameAction(draw, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: 'IC_R2C3',
        position: { x: -1, y: 0 },
        orientation: 270
      }),
      'place'
    );
    const meeple = expectSuccess(
      applyGameAction(place, {
        type: 'place_meeple',
        playerId: 'p1',
        placement: { tilePosition: { x: -1, y: 0 }, featureType: 'road', featureIndex: 0 }
      }),
      'meeple'
    );

    expect(meeple.phase).toBe('game_over');
    expect(meeple.status).toBe('finished');
    expect(meeple.players[0].score).toBe(0);
    expect(meeple.players[0].meeplesAvailable).toBe(6);
    expect(meeple.meeples).toHaveLength(1);
  });

});
