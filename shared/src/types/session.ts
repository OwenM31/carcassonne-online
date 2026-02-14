/**
 * @description Shared types for lobby/game sessions.
 */
export type SessionId = string;
export type SessionStatus = 'lobby' | 'in_progress';

export interface SessionSummary {
  id: SessionId;
  status: SessionStatus;
  playerCount: number;
}
