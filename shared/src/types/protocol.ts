/**
 * @description Message contracts for client/server transport.
 */
import type {
  PlayerColor,
  DrawSandboxTileAction,
  DrawTileAction,
  GameState,
  PlaceMeepleAction,
  PlaceTileAction,
  SetTileOrientationAction,
  PlayerId,
  ReturnAbbotAction,
  SkipMeepleAction
} from './game';
import type { LobbyState } from './lobby';
import type {
  SessionDeckSize,
  SessionAddon,
  SessionAiProfile,
  SessionId,
  SessionMode,
  SessionSummary,
  SessionTakeoverBot,
  SessionTurnTimer
} from './session';

export type ClientMessage =
  | { type: 'list_sessions' }
  | {
      type: 'create_session';
      deckSize?: SessionDeckSize;
      mode?: SessionMode;
      addons?: SessionAddon[];
      turnTimerSeconds?: SessionTurnTimer;
    }
  | { type: 'set_session_deck_size'; sessionId: SessionId; deckSize: SessionDeckSize }
  | { type: 'set_session_mode'; sessionId: SessionId; mode: SessionMode }
  | { type: 'set_session_addons'; sessionId: SessionId; addons: SessionAddon[] }
  | {
      type: 'set_session_player_color';
      sessionId: SessionId;
      color: PlayerColor;
      targetPlayerId?: PlayerId;
    }
  | { type: 'set_session_turn_timer'; sessionId: SessionId; turnTimerSeconds: SessionTurnTimer }
  | { type: 'set_session_takeover_bot'; sessionId: SessionId; takeoverBot: SessionTakeoverBot }
  | { type: 'add_ai_player'; sessionId: SessionId; aiProfile?: SessionAiProfile }
  | { type: 'remove_ai_player'; sessionId: SessionId; aiPlayerId: PlayerId }
  | { type: 'delete_session'; sessionId: SessionId }
  | {
      type: 'join_lobby';
      sessionId: SessionId;
      playerId: PlayerId;
      playerName: string;
      playerPin?: string;
    }
  | { type: 'leave_lobby'; sessionId: SessionId; playerId: PlayerId }
  | { type: 'start_game'; sessionId: SessionId; playerId: PlayerId }
  | { type: 'undo_turn'; sessionId: SessionId; playerId: PlayerId }
  | { type: 'redo_turn'; sessionId: SessionId; playerId: PlayerId }
  | { type: 'reset_sandbox_board'; sessionId: SessionId; playerId: PlayerId }
  | (DrawTileAction & { sessionId: SessionId })
  | (DrawSandboxTileAction & { sessionId: SessionId })
  | (SetTileOrientationAction & { sessionId: SessionId })
  | (PlaceTileAction & { sessionId: SessionId })
  | (PlaceMeepleAction & { sessionId: SessionId })
  | (SkipMeepleAction & { sessionId: SessionId })
  | (ReturnAbbotAction & { sessionId: SessionId });

export type ServerMessage =
  | { type: 'session_list'; sessions: SessionSummary[] }
  | { type: 'lobby_state'; sessionId: SessionId; lobby: LobbyState }
  | { type: 'game_started'; sessionId: SessionId; game: GameState }
  | { type: 'game_state'; sessionId: SessionId; game: GameState }
  | { type: 'error'; message: string };
