/**
 * @description Integration tests for Abbot add-on gameplay rules.
 */
import {
  analyzeBoardFeatures,
  applyGameAction,
  createGame,
  getLegalTilePlacements,
  type GameActionResult,
  type GameSetup
} from '../src';

function expectSuccess(result: GameActionResult, label: string) {
  if (result.type !== 'success') {
    throw new Error(`${label} failed: ${result.message}`);
  }
  return result.game;
}

function toFeatureKey(
  x: number,
  y: number,
  featureType: string,
  featureIndex: number
): string {
  return `${x},${y}:${featureType}:${featureIndex}`;
}

describe('abbot', () => {
  it('allows abbot placement on gardens and rejects normal meeples on gardens', () => {
    const setup: GameSetup = {
      gameId: 'abbot-garden-placement',
      addons: ['abbot'],
      startingTileId: 'T_R3C4',
      tileDeck: ['AB_R2C3', 'T_R1C1'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    };
    const state = createGame(setup);

    const draw = expectSuccess(
      applyGameAction(state, { type: 'draw_tile', playerId: 'p1' }),
      'draw garden tile'
    );
    if (!draw.currentTileId) {
      throw new Error('Expected a drawn tile.');
    }
    const placement = getLegalTilePlacements(draw.board, draw.currentTileId)[0];
    const place = expectSuccess(
      applyGameAction(draw, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: draw.currentTileId,
        position: placement.position,
        orientation: placement.orientation
      }),
      'place garden tile'
    );

    const normalPlacement = applyGameAction(place, {
      type: 'place_meeple',
      playerId: 'p1',
      kind: 'normal',
      placement: {
        tilePosition: placement.position,
        featureType: 'garden',
        featureIndex: 0
      }
    });
    expect(normalPlacement).toEqual({
      type: 'error',
      message: 'Meeple placement is not legal.'
    });

    const abbotPlacement = expectSuccess(
      applyGameAction(place, {
        type: 'place_meeple',
        playerId: 'p1',
        kind: 'abbot',
        placement: {
          tilePosition: placement.position,
          featureType: 'garden',
          featureIndex: 0
        }
      }),
      'place abbot on garden'
    );

    expect(abbotPlacement.players[0].abbotAvailable).toBe(false);
    expect(abbotPlacement.meeples.some((meeple) => meeple.kind === 'abbot')).toBe(true);
  });

  it('returns and scores abbot during meeple phase', () => {
    const setup: GameSetup = {
      gameId: 'abbot-return-scoring',
      addons: ['abbot'],
      startingTileId: 'T_R3C4',
      tileDeck: ['AB_R2C3', 'T_R1C1', 'T_R1C1'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }]
    };
    const state = createGame(setup);

    const drawGarden = expectSuccess(
      applyGameAction(state, { type: 'draw_tile', playerId: 'p1' }),
      'draw garden tile'
    );
    if (!drawGarden.currentTileId) {
      throw new Error('Expected drawn garden tile.');
    }
    const gardenPlacement = getLegalTilePlacements(
      drawGarden.board,
      drawGarden.currentTileId
    )[0];
    const placeGarden = expectSuccess(
      applyGameAction(drawGarden, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: drawGarden.currentTileId,
        position: gardenPlacement.position,
        orientation: gardenPlacement.orientation
      }),
      'place garden tile'
    );
    const placeAbbot = expectSuccess(
      applyGameAction(placeGarden, {
        type: 'place_meeple',
        playerId: 'p1',
        kind: 'abbot',
        placement: {
          tilePosition: gardenPlacement.position,
          featureType: 'garden',
          featureIndex: 0
        }
      }),
      'place abbot'
    );

    const drawNext = expectSuccess(
      applyGameAction(placeAbbot, { type: 'draw_tile', playerId: 'p1' }),
      'draw second tile'
    );
    if (!drawNext.currentTileId) {
      throw new Error('Expected second drawn tile.');
    }
    const secondPlacement = getLegalTilePlacements(drawNext.board, drawNext.currentTileId)[0];
    const placeNext = expectSuccess(
      applyGameAction(drawNext, {
        type: 'place_tile',
        playerId: 'p1',
        tileId: drawNext.currentTileId,
        position: secondPlacement.position,
        orientation: secondPlacement.orientation
      }),
      'place second tile'
    );

    const abbotMeeple = placeNext.meeples.find((meeple) => meeple.kind === 'abbot');
    if (!abbotMeeple) {
      throw new Error('Expected placed abbot before return.');
    }
    const analysis = analyzeBoardFeatures(placeNext.board);
    const featureKey = toFeatureKey(
      abbotMeeple.tilePosition.x,
      abbotMeeple.tilePosition.y,
      abbotMeeple.featureType,
      abbotMeeple.featureIndex
    );
    const componentId = analysis.componentByFeatureKey[featureKey];
    const component = analysis.components.find((entry) => entry.id === componentId);
    if (!component) {
      throw new Error('Expected garden component for abbot.');
    }
    const expectedPoints = 9 - component.openEnds;

    const returnAbbot = expectSuccess(
      applyGameAction(placeNext, { type: 'return_abbot', playerId: 'p1' }),
      'return abbot'
    );

    expect(returnAbbot.players[0].score).toBe(expectedPoints);
    expect(returnAbbot.players[0].abbotAvailable).toBe(true);
    expect(returnAbbot.meeples.some((meeple) => meeple.kind === 'abbot')).toBe(false);
  });
});
