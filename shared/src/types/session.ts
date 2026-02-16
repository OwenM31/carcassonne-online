/**
 * @description Shared types for lobby/game sessions.
 */
import type { PlayerColor, PlayerId } from './game';

export type SessionId = string;
export type SessionStatus = 'lobby' | 'in_progress';
export type SessionDeckSize = 'standard' | 'small';
export type SessionMode = 'standard' | 'sandbox';
export type SessionTurnTimer = 0 | 30 | 60 | 90;
export const SESSION_ADDONS = ['inns_and_cathedrals', 'river', 'river_2', 'abbot'] as const;
export type SessionAddon = (typeof SESSION_ADDONS)[number];
export type SessionAiProfile = 'randy' | 'martin' | 'juan';
export type SessionTakeoverBot = SessionAiProfile;

export interface SessionPlayerSummary {
  name: string;
  color: PlayerColor;
  isAi?: boolean;
  aiProfile?: SessionAiProfile;
  aiPlayerId?: PlayerId;
  isYou?: boolean;
}

export interface SessionSummary {
  id: SessionId;
  status: SessionStatus;
  playerCount: number;
  players: SessionPlayerSummary[];
  deckSize: SessionDeckSize;
  mode: SessionMode;
  addons: SessionAddon[];
  tileCount: number;
  turnTimerSeconds: SessionTurnTimer;
  takeoverBot: SessionTakeoverBot;
}
