/**
 * @description Unit tests for applying game actions.
 */
import {
  applyGameAction,
  createGame,
  getLegalTilePlacements,
  getLegalMeeplePlacements,
  toBoardKey,
  type GameSetup
} from '../src';

describe('applyGameAction', () => {
  const setup: GameSetup = {
    gameId: 'game-1',
    startingTileId: 'T_R3C4',
    tileDeck: ['T_R1C1'],
    players: [
      { id: 'p1', name: 'Ada', color: 'yellow' },
      { id: 'p2', name: 'Linus', color: 'green' }
    ]
  };

  it('draws a tile for the active player and advances to placement', () => {
    const state = createGame(setup);

    const result = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });

    if (result.type !== 'success') {
      throw new Error('Expected draw_tile to succeed.');
    }

    expect(result.game.phase).toBe('place_tile');
    expect(result.game.currentTileId).toBe('T_R1C1');
    expect(result.game.currentTileOrientation).toBe(0);
    expect(result.game.tileDeck).toHaveLength(0);
  });

  it('keeps random draw orientation for non-uniform edge tiles', () => {
    const state = createGame({
      ...setup,
      tileDeck: ['T_R1C2']
    });
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.74);

    const result = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });

    randomSpy.mockRestore();

    if (result.type !== 'success') {
      throw new Error('Expected draw_tile to succeed.');
    }

    expect(result.game.currentTileId).toBe('T_R1C2');
    expect(result.game.currentTileOrientation).toBe(180);
  });

  it('places the drawn tile and advances the turn', () => {
    const state = createGame(setup);
    const drawResult = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });

    if (drawResult.type !== 'success' || !drawResult.game.currentTileId) {
      throw new Error('Expected draw_tile to succeed.');
    }

    const placements = getLegalTilePlacements(
      drawResult.game.board,
      drawResult.game.currentTileId
    );
    const placement = placements[0];

    const placeResult = applyGameAction(drawResult.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: drawResult.game.currentTileId,
      position: placement.position,
      orientation: placement.orientation
    });

    if (placeResult.type !== 'success') {
      throw new Error('Expected place_tile to succeed.');
    }

    const placedTile = placeResult.game.board.tiles[toBoardKey(placement.position)];
    expect(placedTile.tileId).toBe(drawResult.game.currentTileId);
    expect(placeResult.game.currentTileId).toBe('T_R1C1');
    expect(placeResult.game.phase).toBe('place_meeple');
    expect(placeResult.game.activePlayerIndex).toBe(0);
    expect(placeResult.game.turnNumber).toBe(1);
  });

  it('updates current tile orientation during the placement phase', () => {
    const state = createGame(setup);
    const drawResult = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });
    if (drawResult.type !== 'success') {
      throw new Error('Expected draw_tile to succeed.');
    }

    const initialOrientation = drawResult.game.currentTileOrientation;
    const nextOrientation = initialOrientation === 0 ? 90 : 0;
    const orientResult = applyGameAction(drawResult.game, {
      type: 'set_tile_orientation',
      playerId: 'p1',
      orientation: nextOrientation
    });

    expect(orientResult).toMatchObject({
      type: 'success',
      game: {
        currentTileOrientation: nextOrientation
      }
    });
  });

  it('ends the game after skip when the deck is exhausted', () => {
    const state = createGame(setup);
    const drawResult = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });

    if (drawResult.type !== 'success' || !drawResult.game.currentTileId) {
      throw new Error('Expected draw_tile to succeed.');
    }

    const placement = getLegalTilePlacements(
      drawResult.game.board,
      drawResult.game.currentTileId
    )[0];
    const placeResult = applyGameAction(drawResult.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: drawResult.game.currentTileId,
      position: placement.position,
      orientation: placement.orientation
    });

    if (placeResult.type !== 'success') {
      throw new Error('Expected place_tile to succeed.');
    }

    const skipResult = applyGameAction(placeResult.game, {
      type: 'skip_meeple',
      playerId: 'p1'
    });

    if (skipResult.type !== 'success') {
      throw new Error('Expected skip_meeple to succeed.');
    }

    expect(skipResult.game.currentTileId).toBeNull();
    expect(skipResult.game.phase).toBe('game_over');
    expect(skipResult.game.status).toBe('finished');
    expect(skipResult.game.activePlayerIndex).toBe(0);
    expect(skipResult.game.turnNumber).toBe(1);
  });

  it('blocks meeple placement on a connected feature that already has a meeple', () => {
    const connectedRoadSetup: GameSetup = {
      gameId: 'game-connected-road',
      startingTileId: 'T_R3C4',
      tileDeck: ['T_R3C5', 'T_R3C5'],
      players: [
        { id: 'p1', name: 'Ada', color: 'yellow' },
        { id: 'p2', name: 'Linus', color: 'green' }
      ]
    };

    const state = createGame(connectedRoadSetup);

    const drawP1 = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });
    if (drawP1.type !== 'success' || !drawP1.game.currentTileId) {
      throw new Error('Expected player one draw to succeed.');
    }

    const placeP1 = applyGameAction(drawP1.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: drawP1.game.currentTileId,
      position: { x: 1, y: 0 },
      orientation: 90
    });
    if (placeP1.type !== 'success') {
      throw new Error('Expected player one placement to succeed.');
    }

    const legalMeeplesP1 = getLegalMeeplePlacements(placeP1.game);
    const roadMeepleP1 = legalMeeplesP1.find(
      (option) => option.featureType === 'road' && option.featureIndex === 0
    );
    if (!roadMeepleP1) {
      throw new Error('Expected a legal road meeple placement for player one.');
    }

    const meepleP1 = applyGameAction(placeP1.game, {
      type: 'place_meeple',
      playerId: 'p1',
      placement: roadMeepleP1
    });
    if (meepleP1.type !== 'success') {
      throw new Error('Expected player one meeple placement to succeed.');
    }

    const drawP2 = applyGameAction(meepleP1.game, { type: 'draw_tile', playerId: 'p2' });
    if (drawP2.type !== 'success' || !drawP2.game.currentTileId) {
      throw new Error('Expected player two draw to succeed.');
    }

    const placeP2 = applyGameAction(drawP2.game, {
      type: 'place_tile',
      playerId: 'p2',
      tileId: drawP2.game.currentTileId,
      position: { x: 2, y: 0 },
      orientation: 90
    });
    if (placeP2.type !== 'success') {
      throw new Error('Expected player two placement to succeed.');
    }

    const blockedMeeple = applyGameAction(placeP2.game, {
      type: 'place_meeple',
      playerId: 'p2',
      placement: {
        tilePosition: { x: 2, y: 0 },
        featureType: 'road',
        featureIndex: 0
      }
    });

    expect(blockedMeeple).toEqual({
      type: 'error',
      message: 'Feature already has a meeple.'
    });
  });

  it('rejects River 2 placements that create immediate u-turns', () => {
    const state = createGame({
      gameId: 'river2-no-u-turn',
      addons: ['river_2'],
      startingTileId: 'RV2_R1C1',
      tileDeck: ['RV2_R1C2', 'RV2_R1C3', 'RV2_R2C1'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    });

    const drawFork = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });
    if (drawFork.type !== 'success') {
      throw new Error('Expected River 2 fork draw to succeed.');
    }
    const placeFork = applyGameAction(drawFork.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV2_R1C2',
      position: { x: 0, y: -1 },
      orientation: 0
    });
    if (placeFork.type !== 'success') {
      throw new Error('Expected River 2 fork placement to succeed.');
    }
    const skipForkMeeple = applyGameAction(placeFork.game, {
      type: 'skip_meeple',
      playerId: 'p1'
    });
    if (skipForkMeeple.type !== 'success') {
      throw new Error('Expected River 2 fork meeple skip to succeed.');
    }

    const drawCurve = applyGameAction(skipForkMeeple.game, {
      type: 'draw_tile',
      playerId: 'p1'
    });
    if (drawCurve.type !== 'success') {
      throw new Error('Expected River 2 first branch curve draw to succeed.');
    }
    const placeCurve = applyGameAction(drawCurve.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV2_R1C3',
      position: { x: -1, y: -1 },
      orientation: 0
    });
    if (placeCurve.type !== 'success') {
      throw new Error('Expected River 2 first branch curve placement to succeed.');
    }
    const skipCurveMeeple = applyGameAction(placeCurve.game, {
      type: 'skip_meeple',
      playerId: 'p1'
    });
    if (skipCurveMeeple.type !== 'success') {
      throw new Error('Expected River 2 curve meeple skip to succeed.');
    }

    const drawUTurnCurve = applyGameAction(skipCurveMeeple.game, {
      type: 'draw_tile',
      playerId: 'p1'
    });
    if (drawUTurnCurve.type !== 'success') {
      throw new Error('Expected River 2 u-turn curve draw to succeed.');
    }
    const placeUTurnCurve = applyGameAction(drawUTurnCurve.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV2_R2C1',
      position: { x: -1, y: -2 },
      orientation: 90
    });

    expect(placeUTurnCurve).toEqual({
      type: 'error',
      message: 'Tile placement is not legal.'
    });
  });

  it('does not enforce River 2 u-turn restrictions in sandbox mode', () => {
    const state = createGame({
      gameId: 'river2-sandbox-u-turn',
      mode: 'sandbox',
      addons: ['river_2'],
      startingTileId: 'RV2_R1C1',
      tileDeck: ['RV2_R1C2', 'RV2_R1C3', 'RV2_R2C1'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    });

    const drawFork = applyGameAction(state, {
      type: 'draw_sandbox_tile',
      playerId: 'p1',
      tileId: 'RV2_R1C2'
    });
    if (drawFork.type !== 'success') {
      throw new Error('Expected sandbox River 2 fork draw to succeed.');
    }
    const placeFork = applyGameAction(drawFork.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV2_R1C2',
      position: { x: 0, y: -1 },
      orientation: 0
    });
    if (placeFork.type !== 'success') {
      throw new Error('Expected sandbox River 2 fork placement to succeed.');
    }
    const skipForkMeeple = applyGameAction(placeFork.game, {
      type: 'skip_meeple',
      playerId: 'p1'
    });
    if (skipForkMeeple.type !== 'success') {
      throw new Error('Expected sandbox River 2 fork meeple skip to succeed.');
    }

    const drawCurve = applyGameAction(skipForkMeeple.game, {
      type: 'draw_sandbox_tile',
      playerId: 'p1',
      tileId: 'RV2_R1C3'
    });
    if (drawCurve.type !== 'success') {
      throw new Error('Expected sandbox River 2 first branch curve draw to succeed.');
    }
    const placeCurve = applyGameAction(drawCurve.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV2_R1C3',
      position: { x: -1, y: -1 },
      orientation: 0
    });
    if (placeCurve.type !== 'success') {
      throw new Error('Expected sandbox River 2 first branch curve placement to succeed.');
    }
    const skipCurveMeeple = applyGameAction(placeCurve.game, {
      type: 'skip_meeple',
      playerId: 'p1'
    });
    if (skipCurveMeeple.type !== 'success') {
      throw new Error('Expected sandbox River 2 curve meeple skip to succeed.');
    }

    const drawUTurnCurve = applyGameAction(skipCurveMeeple.game, {
      type: 'draw_sandbox_tile',
      playerId: 'p1',
      tileId: 'RV2_R2C1'
    });
    if (drawUTurnCurve.type !== 'success') {
      throw new Error('Expected sandbox River 2 u-turn curve draw to succeed.');
    }
    const placeUTurnCurve = applyGameAction(drawUTurnCurve.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV2_R2C1',
      position: { x: -1, y: -2 },
      orientation: 90
    });

    expect(placeUTurnCurve.type).toBe('success');
  });

  it('rejects River placements that create immediate u-turns', () => {
    const state = createGame({
      gameId: 'river-no-u-turn',
      addons: ['river'],
      startingTileId: 'RV1_R1C1',
      tileDeck: ['RV1_R1C3', 'RV1_R1C3'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    });

    const drawFirstCurve = applyGameAction(state, { type: 'draw_tile', playerId: 'p1' });
    if (drawFirstCurve.type !== 'success') {
      throw new Error('Expected River first curve draw to succeed.');
    }
    const placeFirstCurve = applyGameAction(drawFirstCurve.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV1_R1C3',
      position: { x: 1, y: 0 },
      orientation: 0
    });
    if (placeFirstCurve.type !== 'success') {
      throw new Error('Expected River first curve placement to succeed.');
    }
    const skipFirstCurveMeeple = applyGameAction(placeFirstCurve.game, {
      type: 'skip_meeple',
      playerId: 'p1'
    });
    if (skipFirstCurveMeeple.type !== 'success') {
      throw new Error('Expected River first curve meeple skip to succeed.');
    }

    const drawUTurnCurve = applyGameAction(skipFirstCurveMeeple.game, {
      type: 'draw_tile',
      playerId: 'p1'
    });
    if (drawUTurnCurve.type !== 'success') {
      throw new Error('Expected River u-turn curve draw to succeed.');
    }
    const placeUTurnCurve = applyGameAction(drawUTurnCurve.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV1_R1C3',
      position: { x: 1, y: -1 },
      orientation: 90
    });

    expect(placeUTurnCurve).toEqual({
      type: 'error',
      message: 'Tile placement is not legal.'
    });
  });

  it('does not enforce River u-turn restrictions in sandbox mode', () => {
    const state = createGame({
      gameId: 'river-sandbox-u-turn',
      mode: 'sandbox',
      addons: ['river'],
      startingTileId: 'RV1_R1C1',
      tileDeck: ['RV1_R1C3', 'RV1_R1C3'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    });

    const drawFirstCurve = applyGameAction(state, {
      type: 'draw_sandbox_tile',
      playerId: 'p1',
      tileId: 'RV1_R1C3'
    });
    if (drawFirstCurve.type !== 'success') {
      throw new Error('Expected sandbox River first curve draw to succeed.');
    }
    const placeFirstCurve = applyGameAction(drawFirstCurve.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV1_R1C3',
      position: { x: 1, y: 0 },
      orientation: 0
    });
    if (placeFirstCurve.type !== 'success') {
      throw new Error('Expected sandbox River first curve placement to succeed.');
    }
    const skipFirstCurveMeeple = applyGameAction(placeFirstCurve.game, {
      type: 'skip_meeple',
      playerId: 'p1'
    });
    if (skipFirstCurveMeeple.type !== 'success') {
      throw new Error('Expected sandbox River first curve meeple skip to succeed.');
    }

    const drawUTurnCurve = applyGameAction(skipFirstCurveMeeple.game, {
      type: 'draw_sandbox_tile',
      playerId: 'p1',
      tileId: 'RV1_R1C3'
    });
    if (drawUTurnCurve.type !== 'success') {
      throw new Error('Expected sandbox River u-turn curve draw to succeed.');
    }
    const placeUTurnCurve = applyGameAction(drawUTurnCurve.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: 'RV1_R1C3',
      position: { x: 1, y: -1 },
      orientation: 90
    });

    expect(placeUTurnCurve.type).toBe('success');
  });
});
