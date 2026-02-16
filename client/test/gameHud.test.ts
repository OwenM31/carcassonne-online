/**
 * @description Unit tests for game HUD view state helpers.
 */
import {
  applyGameAction,
  buildTileDeck,
  createGame,
  getLegalTilePlacements,
  getStartingTileCandidates
} from '@carcassonne/shared';

import { buildGameHudState, formatTurnPhase } from '../src/state/gameHud';

describe('gameHud', () => {
  it('formats turn phases into readable labels', () => {
    expect(formatTurnPhase('draw_tile')).toBe('Draw tile');
    expect(formatTurnPhase('place_meeple')).toBe('Place meeple');
    expect(formatTurnPhase('game_over')).toBe('Game over');
  });

  it('builds HUD state from the game', () => {
    const deck = buildTileDeck();
    const [startingTileId] = getStartingTileCandidates();
    const game = createGame({
      gameId: 'g1',
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }],
      tileDeck: deck,
      startingTileId
    });

    game.currentTileId = startingTileId;

    const hud = buildGameHudState(game);

    expect(hud.activePlayer?.id).toBe('p1');
    expect(hud.phaseLabel).toBe('Draw tile');
    expect(hud.deckCount).toBe(game.tileDeck.length);
    expect(hud.currentTileId).toBe(startingTileId);
    expect(hud.scoreboard).toHaveLength(1);
    expect(hud.scoreboard[0].meeplesAvailable).toBe(7);
    expect(hud.featureCounter.cities.total).toBeGreaterThanOrEqual(0);
    expect(hud.eventLog).toHaveLength(1);
    expect(hud.riverDeckCount).toBe(0);
  });

  it('tracks River 2 tiles remaining separately from total deck count', () => {
    const game = createGame({
      gameId: 'g2',
      addons: ['river_2'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }],
      tileDeck: ['RV2_R1C2', 'RV2_R1C3', 'T_R1C1'],
      startingTileId: 'RV2_R1C1'
    });

    const hud = buildGameHudState(game);

    expect(hud.deckCount).toBe(3);
    expect(hud.riverDeckCount).toBe(2);
  });

  it('tracks River tiles remaining separately from total deck count', () => {
    const game = createGame({
      gameId: 'g2-river',
      addons: ['river'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }],
      tileDeck: ['RV1_R1C2', 'RV1_R2C1', 'T_R1C1'],
      startingTileId: 'RV1_R1C1'
    });

    const hud = buildGameHudState(game);

    expect(hud.deckCount).toBe(3);
    expect(hud.riverDeckCount).toBe(2);
  });

  it('tracks abbot availability and placement in the scoreboard', () => {
    const game = createGame({
      gameId: 'g3',
      addons: ['abbot'],
      players: [{ id: 'p1', name: 'Ada', color: 'yellow' }],
      tileDeck: ['AB_R2C3', 'T_R1C1'],
      startingTileId: 'T_R3C4'
    });

    const draw = applyGameAction(game, { type: 'draw_tile', playerId: 'p1' });
    if (draw.type !== 'success' || !draw.game.currentTileId) {
      throw new Error('Expected draw to succeed.');
    }
    const placement = getLegalTilePlacements(draw.game.board, draw.game.currentTileId)[0];
    const place = applyGameAction(draw.game, {
      type: 'place_tile',
      playerId: 'p1',
      tileId: draw.game.currentTileId,
      position: placement.position,
      orientation: placement.orientation
    });
    if (place.type !== 'success') {
      throw new Error('Expected placement to succeed.');
    }
    const placeAbbot = applyGameAction(place.game, {
      type: 'place_meeple',
      playerId: 'p1',
      kind: 'abbot',
      placement: {
        tilePosition: placement.position,
        featureType: 'garden',
        featureIndex: 0
      }
    });
    if (placeAbbot.type !== 'success') {
      throw new Error('Expected abbot placement to succeed.');
    }

    const hud = buildGameHudState(placeAbbot.game);

    expect(hud.hasAbbots).toBe(true);
    expect(hud.scoreboard[0].abbotAvailable).toBe(false);
    expect(hud.scoreboard[0].abbotPlaced).toBe(true);
  });
});
