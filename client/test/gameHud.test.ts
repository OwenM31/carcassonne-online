/**
 * @description Unit tests for game HUD view state helpers.
 */
import { buildTileDeck, createGame, getStartingTileCandidates } from '@carcassonne/shared';

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
      players: [{ id: 'p1', name: 'Ada', color: 'red' }],
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
  });
});
