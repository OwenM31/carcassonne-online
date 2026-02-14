/**
 * @description State helpers for lobby/session UI state.
 */
import type { LobbyState, ServerMessage, SessionSummary } from '@carcassonne/shared';

export interface LobbyViewState {
  lobby: LobbyState | null;
  sessions: SessionSummary[];
  error: string | null;
}

export const initialLobbyViewState: LobbyViewState = {
  lobby: null,
  sessions: [],
  error: null
};

export function applyLobbyMessage(
  state: LobbyViewState,
  message: ServerMessage,
  activeSessionId: string | null
): LobbyViewState {
  switch (message.type) {
    case 'session_list':
      return { ...state, sessions: message.sessions };
    case 'lobby_state':
      if (!activeSessionId || message.sessionId !== activeSessionId) {
        return state;
      }
      return { ...state, lobby: message.lobby, error: null };
    case 'error':
      return { ...state, error: message.message };
    default:
      return state;
  }
}
