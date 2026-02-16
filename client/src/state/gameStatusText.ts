/**
 * @description Computes player-facing turn instructions for the game screen.
 */
import type { GameState, MeeplePlacement } from '@carcassonne/shared';

export function getStatusText(
  game: GameState,
  isActivePlayer: boolean,
  activePlayerName: string | undefined,
  meepleOptions: MeeplePlacement[]
): string {
  if (game.status === 'finished' || game.phase === 'game_over') {
    return 'Game over. Final scoring is complete.';
  }

  if (!isActivePlayer) {
    return `Waiting on ${activePlayerName ?? 'another player'} to move.`;
  }

  if (game.phase === 'draw_tile') {
    if (game.tileDeck.length === 0) {
      return 'Deck exhausted. Waiting for final scoring.';
    }

    if (game.mode === 'sandbox') {
      return 'Select a tile from the sandbox tray to begin your turn.';
    }

    return 'Draw a tile to begin your turn.';
  }

  if (game.phase === 'place_tile') {
    return 'Pick a placement on the board and confirm the rotation.';
  }

  if (game.phase === 'place_meeple') {
    const activePlayer = game.players[game.activePlayerIndex];
    const canReturnAbbot =
      !!activePlayer &&
      game.addons.includes('abbot') &&
      game.meeples.some(
        (meeple) => meeple.playerId === activePlayer.id && meeple.kind === 'abbot'
      );
    if (meepleOptions.length === 0) {
      return canReturnAbbot
        ? 'No legal meeple placement is available. Return your abbot or skip to end your turn.'
        : 'No legal meeple placement is available. Skip to end your turn.';
    }
    return canReturnAbbot
      ? 'Optionally place one meeple, return your abbot, or skip.'
      : 'Optionally place one meeple on the tile you just placed, or skip.';
  }

  return 'Waiting for the next action.';
}
