/**
 * @description Shared types for lobby/game sessions.
 */
export type SessionId = string;
export type SessionStatus = 'lobby' | 'in_progress';
export type SessionDeckSize = 'standard' | 'small';
export type SessionMode = 'standard' | 'sandbox';
export type SessionTurnTimer = 0 | 30 | 60 | 90;
export type SessionAiProfile = 'randy' | 'martin';
export type SessionTakeoverBot = SessionAiProfile;

export interface SessionPlayerSummary {
  name: string;
  isAi?: boolean;
  aiProfile?: SessionAiProfile;
}

export interface SessionSummary {
  id: SessionId;
  status: SessionStatus;
  playerCount: number;
  players: SessionPlayerSummary[];
  deckSize: SessionDeckSize;
  mode: SessionMode;
  turnTimerSeconds: SessionTurnTimer;
  takeoverBot: SessionTakeoverBot;
}
