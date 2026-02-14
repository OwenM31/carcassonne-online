/**
 * @description Selectors for game state derived data.
 */
import type { GameState } from '@carcassonne/shared';

export function isPlayerInGame(game: GameState, playerId: string): boolean {
  return game.players.some((player) => player.id === playerId);
}
