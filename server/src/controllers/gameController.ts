/**
 * @description Controller for routing game actions to the game service.
 */
import type { GameAction, ServerMessage, SessionId } from '@carcassonne/shared';
import type { GameService } from '../services/gameService';

export interface GameController {
  handleAction(action: GameAction): ServerMessage;
  handleUndo(playerId: string): ServerMessage;
  handleSandboxReset(playerId: string): ServerMessage;
}

export function createGameController(
  sessionId: SessionId,
  gameService: GameService
): GameController {
  return {
    handleAction(action: GameAction) {
      const result = gameService.applyAction(action);

      if (result.type === 'error') {
        return { type: 'error', message: result.message };
      }

      return { type: 'game_state', sessionId, game: result.game };
    },
    handleUndo(_playerId: string) {
      const result = gameService.undo();

      if (result.type === 'error') {
        return { type: 'error', message: result.message };
      }

      return { type: 'game_state', sessionId, game: result.game };
    },
    handleSandboxReset(playerId: string) {
      const result = gameService.resetSandboxBoard(playerId);

      if (result.type === 'error') {
        return { type: 'error', message: result.message };
      }

      return { type: 'game_state', sessionId, game: result.game };
    }
  };
}
