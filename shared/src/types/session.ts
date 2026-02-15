/**
 * @description Shared types for lobby/game sessions.
 */
export type SessionId = string;
export type SessionStatus = 'lobby' | 'in_progress';
export type SessionDeckSize = 'standard' | 'small';
export type SessionMode = 'standard' | 'sandbox';

export interface SessionSummary {
  id: SessionId;
  status: SessionStatus;
  playerCount: number;
  deckSize: SessionDeckSize;
  mode: SessionMode;
}
