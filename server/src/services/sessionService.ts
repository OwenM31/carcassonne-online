/**
 * @description In-memory registry for lobby/game sessions.
 */
import type {
  PlayerId,
  SessionAiProfile,
  SessionDeckSize,
  SessionId,
  SessionMode,
  SessionSummary,
  SessionStatus,
  SessionTurnTimer
} from '@carcassonne/shared';

import type { GameService } from './gameService';
import type { LobbyService } from './lobbyService';
import { InMemoryGameService } from './gameService';
import { InMemoryLobbyService } from './lobbyService';
import type {
  PersistedSessionSnapshot,
  SessionPersistenceService
} from './sessionPersistenceService';

export interface SessionRecord {
  id: SessionId;
  deckSize: SessionDeckSize;
  mode: SessionMode;
  turnTimerSeconds: SessionTurnTimer;
  aiPlayerIds: Set<PlayerId>;
  lobbyService: LobbyService;
  gameService: GameService;
}

export type SessionDeckSizeUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionModeUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionTurnTimerUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionAiPlayerAddResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export interface SessionService {
  createSession(
    deckSize?: SessionDeckSize,
    mode?: SessionMode,
    turnTimerSeconds?: SessionTurnTimer
  ): SessionRecord;
  updateSessionDeckSize(
    sessionId: SessionId,
    deckSize: SessionDeckSize
  ): SessionDeckSizeUpdateResult;
  updateSessionMode(sessionId: SessionId, mode: SessionMode): SessionModeUpdateResult;
  updateSessionTurnTimer(
    sessionId: SessionId,
    turnTimerSeconds: SessionTurnTimer
  ): SessionTurnTimerUpdateResult;
  addAiPlayer(
    sessionId: SessionId,
    aiProfile?: SessionAiProfile
  ): SessionAiPlayerAddResult;
  isAiPlayer(sessionId: SessionId, playerId: PlayerId): boolean;
  getSession(sessionId: SessionId): SessionRecord | null;
  listSessions(): SessionSummary[];
  deleteSession(sessionId: SessionId): boolean;
  persist(): void;
}

type SessionIdFactory = () => SessionId;
type SessionFactory = (
  id: SessionId,
  deckSize: SessionDeckSize,
  mode: SessionMode,
  turnTimerSeconds: SessionTurnTimer
) => SessionRecord;

const defaultSessionIdFactory: SessionIdFactory = () =>
  `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const MAX_PLAYERS = 5;
const DEFAULT_AI_PROFILE: SessionAiProfile = 'randy';
const AI_DISPLAY_NAME: Record<SessionAiProfile, string> = {
  randy: 'RANDY'
};

const defaultSessionFactory: SessionFactory = (id, deckSize, mode, turnTimerSeconds) => ({
  id,
  deckSize,
  mode,
  turnTimerSeconds,
  aiPlayerIds: new Set<PlayerId>(),
  lobbyService: new InMemoryLobbyService(),
  gameService: new InMemoryGameService()
});

export class InMemorySessionService implements SessionService {
  private sessions = new Map<SessionId, SessionRecord>();
  private idFactory: SessionIdFactory;
  private sessionFactory: SessionFactory;
  private persistence: SessionPersistenceService | null;

  constructor(
    idFactory: SessionIdFactory = defaultSessionIdFactory,
    sessionFactory: SessionFactory = defaultSessionFactory,
    persistence: SessionPersistenceService | null = null
  ) {
    this.idFactory = idFactory;
    this.sessionFactory = sessionFactory;
    this.persistence = persistence;
    this.restorePersistedSessions();
  }

  createSession(
    deckSize: SessionDeckSize = 'standard',
    mode: SessionMode = 'standard',
    turnTimerSeconds: SessionTurnTimer = 60
  ): SessionRecord {
    const id = this.idFactory();
    const session = this.sessionFactory(id, deckSize, mode, turnTimerSeconds);
    this.sessions.set(id, session);
    this.persist();
    return session;
  }

  updateSessionDeckSize(
    sessionId: SessionId,
    deckSize: SessionDeckSize
  ): SessionDeckSizeUpdateResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found.' };
    }

    if (session.gameService.getGame()) {
      return { type: 'error', message: 'Cannot change deck size after game start.' };
    }

    session.deckSize = deckSize;
    this.persist();
    return { type: 'success', session };
  }

  updateSessionMode(sessionId: SessionId, mode: SessionMode): SessionModeUpdateResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found.' };
    }

    if (session.gameService.getGame()) {
      return { type: 'error', message: 'Cannot change session mode after game start.' };
    }

    session.mode = mode;
    this.persist();
    return { type: 'success', session };
  }

  updateSessionTurnTimer(
    sessionId: SessionId,
    turnTimerSeconds: SessionTurnTimer
  ): SessionTurnTimerUpdateResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found.' };
    }

    if (session.gameService.getGame()) {
      return { type: 'error', message: 'Cannot change turn timer after game start.' };
    }

    session.turnTimerSeconds = turnTimerSeconds;
    this.persist();
    return { type: 'success', session };
  }

  addAiPlayer(
    sessionId: SessionId,
    aiProfile: SessionAiProfile = DEFAULT_AI_PROFILE
  ): SessionAiPlayerAddResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found.' };
    }

    if (session.gameService.getGame()) {
      return { type: 'error', message: 'Cannot add AI players after game start.' };
    }

    const lobby = session.lobbyService.getState();
    if (lobby.players.length >= MAX_PLAYERS) {
      return { type: 'error', message: `Only ${MAX_PLAYERS} players are supported.` };
    }

    const nextSeatNumber = countAiSeats(session, aiProfile) + 1;
    const playerId = `ai-${aiProfile}-${nextSeatNumber}`;
    const playerName = formatAiName(aiProfile, nextSeatNumber);
    session.lobbyService.join(playerId, playerName);
    session.aiPlayerIds.add(playerId);
    this.persist();
    return { type: 'success', session };
  }

  isAiPlayer(sessionId: SessionId, playerId: PlayerId): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    return session.aiPlayerIds.has(playerId);
  }

  getSession(sessionId: SessionId): SessionRecord | null {
    return this.sessions.get(sessionId) ?? null;
  }

  listSessions(): SessionSummary[] {
    return Array.from(this.sessions.values()).map((session) =>
      buildSummary(session)
    );
  }

  deleteSession(sessionId: SessionId): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.persist();
    }
    return deleted;
  }

  persist(): void {
    if (!this.persistence) {
      return;
    }

    const snapshots = Array.from(this.sessions.values()).map((session) =>
      toSnapshot(session)
    );
    this.persistence.saveSessions(snapshots);
  }

  private restorePersistedSessions(): void {
    if (!this.persistence) {
      return;
    }

    this.persistence.loadSessions().forEach((snapshot) => {
      this.sessions.set(snapshot.id, fromSnapshot(snapshot));
    });
  }
}

function buildSummary(session: SessionRecord): SessionSummary {
  const lobby = session.lobbyService.getState();
  const game = session.gameService.getGame();
  const status: SessionStatus = game ? 'in_progress' : 'lobby';

  return {
    id: session.id,
    status,
    playerCount: lobby.players.length,
    players: lobby.players.map((player) => {
      const isAi = session.aiPlayerIds.has(player.id);
      if (!isAi) {
        return { name: player.name };
      }

      const aiProfile = inferAiProfile(player.id);
      return {
        name: player.name,
        isAi: true,
        ...(aiProfile ? { aiProfile } : {})
      };
    }),
    deckSize: session.deckSize,
    mode: session.mode,
    turnTimerSeconds: session.turnTimerSeconds
  };
}

function toSnapshot(session: SessionRecord): PersistedSessionSnapshot {
  return {
    id: session.id,
    deckSize: session.deckSize,
    mode: session.mode,
    turnTimerSeconds: session.turnTimerSeconds,
    aiPlayerIds: Array.from(session.aiPlayerIds.values()),
    lobby: session.lobbyService.getState(),
    lobbyPinHashes: session.lobbyService.getPlayerPinHashes(),
    gameRejoinPinHashes: session.lobbyService.getGameRejoinPinHashes(),
    game: session.gameService.getSnapshot()
  };
}

function fromSnapshot(snapshot: PersistedSessionSnapshot): SessionRecord {
  return {
    id: snapshot.id,
    deckSize: snapshot.deckSize,
    mode: snapshot.mode,
    turnTimerSeconds: snapshot.turnTimerSeconds,
    aiPlayerIds: new Set(snapshot.aiPlayerIds),
    lobbyService: new InMemoryLobbyService(
      snapshot.lobby,
      snapshot.lobbyPinHashes,
      snapshot.gameRejoinPinHashes
    ),
    gameService: new InMemoryGameService(undefined, snapshot.game)
  };
}

function countAiSeats(session: SessionRecord, aiProfile: SessionAiProfile): number {
  const prefix = `ai-${aiProfile}-`;
  return Array.from(session.aiPlayerIds).filter((playerId) => playerId.startsWith(prefix)).length;
}

function inferAiProfile(playerId: PlayerId): SessionAiProfile | undefined {
  if (playerId.startsWith('ai-randy-')) {
    return 'randy';
  }

  return undefined;
}

function formatAiName(aiProfile: SessionAiProfile, seatNumber: number): string {
  const label = AI_DISPLAY_NAME[aiProfile] ?? aiProfile.toUpperCase();
  return seatNumber === 1 ? label : `${label} ${seatNumber}`;
}
