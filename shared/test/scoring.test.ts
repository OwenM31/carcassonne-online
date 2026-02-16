/**
 * @description Unit tests for mid-game and end-game scoring behavior.
 */
import { applyGameAction, createGame, type GameSetup } from '../src';

describe('scoring', () => {
  it('scores a completed road during the turn and returns meeples', () => {
    const setup: GameSetup = {
      gameId: 'score-road',
      startingTileId: 'T_R3C4',
      tileDeck: ['T_R1C2', 'T_R1C2'],
      players: [
        { id: 'p1', name: 'Ada', color: 'yellow' },
        { id: 'p2', name: 'Linus', color: 'green' }
      ]
    };
    const state = createGame(setup);

    const drawP1 = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });
    if (drawP1.type !== 'success' || !drawP1.game.currentTileId) {
      throw new Error('Expected p1 draw to succeed.');
    }

    const placeP1 = applyGameAction(drawP1.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: drawP1.game.currentTileId,
      position: { x: -1, y: 0 },
      orientation: 270
    });
    if (placeP1.type !== 'success') {
      throw new Error('Expected p1 placement to succeed.');
    }

    const meepleP1 = applyGameAction(placeP1.game, {
      type: 'place_meeple',
      playerId: 'p1',
      placement: {
        tilePosition: { x: -1, y: 0 },
        featureType: 'road',
        featureIndex: 0
      }
    });
    if (meepleP1.type !== 'success') {
      throw new Error('Expected p1 meeple placement to succeed.');
    }

    const drawP2 = applyGameAction(meepleP1.game, { type: 'draw_tile', playerId: 'p2' });
    if (drawP2.type !== 'success' || !drawP2.game.currentTileId) {
      throw new Error('Expected p2 draw to succeed.');
    }

    const placeP2 = applyGameAction(drawP2.game, {
      type: 'place_tile',
      playerId: 'p2',
      tileId: drawP2.game.currentTileId,
      position: { x: 1, y: 0 },
      orientation: 90
    });
    if (placeP2.type !== 'success') {
      throw new Error('Expected p2 placement to succeed.');
    }

    const skipP2 = applyGameAction(placeP2.game, { type: 'skip_meeple', playerId: 'p2' });
    if (skipP2.type !== 'success') {
      throw new Error('Expected p2 skip to succeed.');
    }

    const p1 = skipP2.game.players.find((player) => player.id === 'p1');
    expect(skipP2.game.status).toBe('finished');
    expect(skipP2.game.phase).toBe('game_over');
    expect(p1?.score).toBe(3);
    expect(p1?.meeplesAvailable).toBe(7);
    expect(skipP2.game.meeples).toHaveLength(0);
  });

  it('scores unfinished monasteries at game end', () => {
    const setup: GameSetup = {
      gameId: 'score-monastery-end',
      startingTileId: 'T_R3C4',
      tileDeck: ['T_R1C1'],
      players: [
        { id: 'p1', name: 'Ada', color: 'yellow' },
        { id: 'p2', name: 'Linus', color: 'green' }
      ]
    };
    const state = createGame(setup);

    const drawP1 = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });
    if (drawP1.type !== 'success' || !drawP1.game.currentTileId) {
      throw new Error('Expected p1 draw to succeed.');
    }

    const placeP1 = applyGameAction(drawP1.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: drawP1.game.currentTileId,
      position: { x: 0, y: -1 },
      orientation: 0
    });
    if (placeP1.type !== 'success') {
      throw new Error('Expected p1 placement to succeed.');
    }

    const meepleP1 = applyGameAction(placeP1.game, {
      type: 'place_meeple',
      playerId: 'p1',
      placement: {
        tilePosition: { x: 0, y: -1 },
        featureType: 'monastery',
        featureIndex: 0
      }
    });
    if (meepleP1.type !== 'success') {
      throw new Error('Expected p1 monastery meeple to succeed.');
    }

    const p1 = meepleP1.game.players.find((player) => player.id === 'p1');
    expect(meepleP1.game.status).toBe('finished');
    expect(meepleP1.game.phase).toBe('game_over');
    expect(p1?.score).toBe(2);
    expect(p1?.meeplesAvailable).toBe(6);
    expect(meepleP1.game.meeples).toHaveLength(1);
  });

  it('scores farms at game end using completed adjacent cities', () => {
    const setup: GameSetup = {
      gameId: 'score-farm-end',
      startingTileId: 'T_R3C4',
      tileDeck: ['T_R2C8'],
      players: [
        { id: 'p1', name: 'Ada', color: 'yellow' },
        { id: 'p2', name: 'Linus', color: 'green' }
      ]
    };
    const state = createGame(setup);

    const drawP1 = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });
    if (drawP1.type !== 'success' || !drawP1.game.currentTileId) {
      throw new Error('Expected p1 draw to succeed.');
    }

    const placeP1 = applyGameAction(drawP1.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: drawP1.game.currentTileId,
      position: { x: 0, y: 1 },
      orientation: 180
    });
    if (placeP1.type !== 'success') {
      throw new Error('Expected p1 placement to succeed.');
    }

    const meepleP1 = applyGameAction(placeP1.game, {
      type: 'place_meeple',
      playerId: 'p1',
      placement: {
        tilePosition: { x: 0, y: 1 },
        featureType: 'farm',
        featureIndex: 0
      }
    });
    if (meepleP1.type !== 'success') {
      throw new Error('Expected p1 farm meeple to succeed.');
    }

    const p1 = meepleP1.game.players.find((player) => player.id === 'p1');
    expect(meepleP1.game.status).toBe('finished');
    expect(meepleP1.game.phase).toBe('game_over');
    expect(p1?.score).toBe(3);
    expect(p1?.meeplesAvailable).toBe(6);
    expect(meepleP1.game.meeples).toHaveLength(1);
  });
});
