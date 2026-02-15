/**
 * @description Message contracts for client/server transport.
 */
import type {
  DrawSandboxTileAction,
  DrawTileAction,
  GameState,
  PlaceMeepleAction,
  PlaceTileAction,
  PlayerId,
  SkipMeepleAction
} from './game';
import type { LobbyState } from './lobby';
import type { SessionDeckSize, SessionId, SessionMode, SessionSummary } from './session';

export type ClientMessage =
  | { type: 'list_sessions' }
  | { type: 'create_session'; deckSize?: SessionDeckSize; mode?: SessionMode }
  | { type: 'set_session_deck_size'; sessionId: SessionId; deckSize: SessionDeckSize }
  | { type: 'set_session_mode'; sessionId: SessionId; mode: SessionMode }
  | { type: 'delete_session'; sessionId: SessionId }
  | { type: 'join_lobby'; sessionId: SessionId; playerId: PlayerId; playerName: string }
  | { type: 'leave_lobby'; sessionId: SessionId; playerId: PlayerId }
  | { type: 'start_game'; sessionId: SessionId; playerId: PlayerId }
  | { type: 'undo_turn'; sessionId: SessionId; playerId: PlayerId }
  | (DrawTileAction & { sessionId: SessionId })
  | (DrawSandboxTileAction & { sessionId: SessionId })
  | (PlaceTileAction & { sessionId: SessionId })
  | (PlaceMeepleAction & { sessionId: SessionId })
  | (SkipMeepleAction & { sessionId: SessionId });

export type ServerMessage =
  | { type: 'session_list'; sessions: SessionSummary[] }
  | { type: 'lobby_state'; sessionId: SessionId; lobby: LobbyState }
  | { type: 'game_started'; sessionId: SessionId; game: GameState }
  | { type: 'game_state'; sessionId: SessionId; game: GameState }
  | { type: 'error'; message: string };
