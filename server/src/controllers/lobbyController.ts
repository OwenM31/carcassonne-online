/**
 * @description Handles lobby actions and resets games when players disconnect.
 */
import type {
  ClientMessage,
  GameState,
  LobbyState,
  PlayerId,
  SessionAiProfile,
  SessionDeckSize,
  SessionMode,
  SessionTurnTimer,
  ServerMessage,
  SessionId
} from '@carcassonne/shared';

import type { GameService } from '../services/gameService';
import type { LobbyService } from '../services/lobbyService';

export interface LobbyController {
  handleMessage(message: ClientMessage): ServerMessage;
  handleDisconnect(playerId: PlayerId): ServerMessage;
}

type AddAiPlayerResult =
  | { type: 'success'; lobby: LobbyState }
  | { type: 'error'; message: string };
type AddAiPlayer = (aiProfile: SessionAiProfile) => AddAiPlayerResult;
type IsAiPlayer = (playerId: PlayerId) => boolean;

export function createLobbyController(
  sessionId: SessionId,
  service: LobbyService,
  gameService: GameService,
  getSessionConfig: () => {
    deckSize: SessionDeckSize;
    mode: SessionMode;
    turnTimerSeconds: SessionTurnTimer;
  } = () => ({
    deckSize: 'standard',
    mode: 'standard',
    turnTimerSeconds: 60
  }),
  addAiPlayer: AddAiPlayer = () => ({
    type: 'error',
    message: 'Adding AI players is not available.'
  }),
  isAiPlayer: IsAiPlayer = () => false
): LobbyController {
  return {
    handleMessage(message: ClientMessage) {
      switch (message.type) {
        case 'add_ai_player': {
          const result = addAiPlayer(message.aiProfile ?? 'randy');
          if (result.type === 'error') {
            return { type: 'error', message: result.message };
          }

          return { type: 'lobby_state', sessionId, lobby: result.lobby };
        }
        case 'join_lobby': {
          if (isAiPlayer(message.playerId)) {
            return { type: 'error', message: 'AI seats cannot be joined manually.' };
          }

          const trimmedName = message.playerName.trim();
          if (!trimmedName) {
            return { type: 'error', message: 'Player name is required.' };
          }

          const activeGame = gameService.getGame();
          if (activeGame) {
            if (!isPlayerInGame(activeGame, message.playerId)) {
              return { type: 'error', message: 'Game in progress.' };
            }

            const rejoinCheck = service.validateGameRejoin(
              message.playerId,
              message.playerPin
            );
            if (rejoinCheck === 'pin_not_set') {
              return {
                type: 'error',
                message: 'Rejoin is unavailable because no PIN was set.'
              };
            }
            if (rejoinCheck === 'incorrect_passkey') {
              return { type: 'error', message: 'Incorrect passkey.' };
            }
          }

          const lobby = service.join(message.playerId, trimmedName, message.playerPin);

          return activeGame
            ? { type: 'game_state', sessionId, game: activeGame }
            : { type: 'lobby_state', sessionId, lobby };
        }
        case 'leave_lobby': {
          const lobby = service.leave(message.playerId);
          if (shouldResetGame(lobby, gameService)) {
            gameService.reset();
            service.clearGameRejoinPins();
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

          const result = gameService.startGame(lobby.players, getSessionConfig());

          if (result.type === 'error') {
            return { type: 'error', message: result.message };
          }

          service.lockGameRejoinPins(lobby.players.map((player) => player.id));

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
        service.clearGameRejoinPins();
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
  const game = gameService.getGame();
  if (!game) {
    return lobby.players.length === 0;
  }

  if (game.status === 'active') {
    return false;
  }

  if (lobby.players.length === 0) {
    return true;
  }

  const lobbyPlayerIds = new Set(lobby.players.map((player) => player.id));
  return !game.players.some((player) => lobbyPlayerIds.has(player.id));
}

function isPlayerInGame(game: Pick<GameState, 'players'>, playerId: PlayerId) {
  return game.players.some((player) => player.id === playerId);
}
