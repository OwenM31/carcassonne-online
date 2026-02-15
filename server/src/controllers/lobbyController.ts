/**
 * @description Handles lobby actions and resets games when players disconnect.
 */
import type {
  ClientMessage,
  LobbyState,
  PlayerId,
  SessionDeckSize,
  ServerMessage,
  SessionId
} from '@carcassonne/shared';

import type { GameService } from '../services/gameService';
import type { LobbyService } from '../services/lobbyService';

export interface LobbyController {
  handleMessage(message: ClientMessage): ServerMessage;
  handleDisconnect(playerId: PlayerId): ServerMessage;
}

export function createLobbyController(
  sessionId: SessionId,
  service: LobbyService,
  gameService: GameService,
  getDeckSize: () => SessionDeckSize = () => 'standard'
): LobbyController {
  return {
    handleMessage(message: ClientMessage) {
      switch (message.type) {
        case 'join_lobby': {
          const trimmedName = message.playerName.trim();
          if (!trimmedName) {
            return { type: 'error', message: 'Player name is required.' };
          }

          const activeGame = gameService.getGame();
          if (activeGame && !isPlayerInGame(activeGame, message.playerId)) {
            return { type: 'error', message: 'Game in progress.' };
          }

          const lobby = service.join(message.playerId, trimmedName);

          return activeGame
            ? { type: 'game_state', sessionId, game: activeGame }
            : { type: 'lobby_state', sessionId, lobby };
        }
        case 'leave_lobby': {
          const lobby = service.leave(message.playerId);
          if (shouldResetGame(lobby, gameService)) {
            gameService.reset();
          }

          return {
            type: 'lobby_state',
            sessionId,
            lobby
          };
        }
        case 'start_game': {
          const lobby = service.getState();
          const isPlayerInLobby = lobby.players.some(
            (player) => player.id === message.playerId
          );

          if (!isPlayerInLobby) {
            return {
              type: 'error',
              message: 'Join the lobby before starting a game.'
            };
          }

          const result = gameService.startGame(lobby.players, getDeckSize());

          if (result.type === 'error') {
            return { type: 'error', message: result.message };
          }

          return { type: 'game_started', sessionId, game: result.game };
        }
        default:
          return { type: 'error', message: 'Unsupported lobby action.' };
      }
    },
    handleDisconnect(playerId: PlayerId) {
      const lobby = service.leave(playerId);
      if (shouldResetGame(lobby, gameService)) {
        gameService.reset();
      }

      return {
        type: 'lobby_state',
        sessionId,
        lobby
      };
    }
  };
}

function shouldResetGame(lobby: LobbyState, gameService: GameService): boolean {
  if (lobby.players.length === 0) {
    return true;
  }

  const game = gameService.getGame();
  if (!game) {
    return false;
  }

  const lobbyPlayerIds = new Set(lobby.players.map((player) => player.id));
  return !game.players.some((player) => lobbyPlayerIds.has(player.id));
}

function isPlayerInGame(game: { players: Array<{ id: PlayerId }> }, playerId: PlayerId) {
  return game.players.some((player) => player.id === playerId);
}
