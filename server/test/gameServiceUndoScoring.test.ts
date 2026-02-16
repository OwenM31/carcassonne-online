/**
 * @description Regression test for undoing score updates from the prior action.
 */
import { applyGameAction, createGame, type GameState, type GameSetup } from '@carcassonne/shared';
import { InMemoryGameService } from '../src/services/gameService';

describe('InMemoryGameService undo scoring', () => {
  it('restores score, meeples, and event log after undoing a scoring action', () => {
    const service = new InMemoryGameService(() => 'game-undo-score');
    const beforeScoring = createStateBeforeScoring();
    Reflect.set(service as object, 'game', beforeScoring);
    Reflect.set(service as object, 'history', []);

    const scoringResult = service.applyAction({ type: 'skip_meeple', playerId: 'p2' });
    if (scoringResult.type !== 'success') {
      throw new Error('Expected skip_meeple scoring action to succeed.');
    }

    const beforePlayer = beforeScoring.players.find((player) => player.id === 'p1');
    const afterPlayer = scoringResult.game.players.find((player) => player.id === 'p1');
    expect(afterPlayer?.score).toBeGreaterThan(beforePlayer?.score ?? -1);
    expect(scoringResult.game.eventLog.length).toBeGreaterThan(beforeScoring.eventLog.length);

    const undoResult = service.undo();
    if (undoResult.type !== 'success') {
      throw new Error('Expected undo to succeed.');
    }

    expect(undoResult.game).toEqual({ ...beforeScoring, canRedo: true });
  });
});

function createStateBeforeScoring(): GameState {
  const setup: GameSetup = {
    gameId: 'pre-score-state',
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

  return placeP2.game;
}
