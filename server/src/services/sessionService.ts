/**
 * @description In-memory registry for lobby/game sessions.
 */
import type {
  PlayerColor,
  PlayerId,
  SessionAddon,
  SessionAiProfile,
  SessionDeckSize,
  SessionId,
  SessionMode,
  SessionSummary,
  SessionStatus,
  SessionTakeoverBot,
  SessionTurnTimer
} from '@carcassonne/shared';
import { buildTileDeck } from '@carcassonne/shared';

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
  addons: SessionAddon[];
  turnTimerSeconds: SessionTurnTimer;
  takeoverBot: SessionTakeoverBot;
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

export type SessionAddonsUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionTurnTimerUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionPlayerColorUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionTakeoverBotUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionAiPlayerAddResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionAiPlayerRemoveResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export interface SessionService {
  createSession(
    deckSize?: SessionDeckSize,
    mode?: SessionMode,
    turnTimerSeconds?: SessionTurnTimer,
    addons?: SessionAddon[]
  ): SessionRecord;
  updateSessionDeckSize(
    sessionId: SessionId,
    deckSize: SessionDeckSize
  ): SessionDeckSizeUpdateResult;
  updateSessionMode(sessionId: SessionId, mode: SessionMode): SessionModeUpdateResult;
  updateSessionAddons(
    sessionId: SessionId,
    addons: SessionAddon[]
  ): SessionAddonsUpdateResult;
  updateSessionTurnTimer(
    sessionId: SessionId,
    turnTimerSeconds: SessionTurnTimer
  ): SessionTurnTimerUpdateResult;
  updateSessionPlayerColor(
    sessionId: SessionId,
    requesterPlayerId: PlayerId,
    targetPlayerId: PlayerId,
    color: PlayerColor
  ): SessionPlayerColorUpdateResult;
  updateSessionTakeoverBot(
    sessionId: SessionId,
    takeoverBot: SessionTakeoverBot
  ): SessionTakeoverBotUpdateResult;
  addAiPlayer(
    sessionId: SessionId,
    aiProfile?: SessionAiProfile
  ): SessionAiPlayerAddResult;
  removeAiPlayer(
    sessionId: SessionId,
    aiPlayerId: PlayerId
  ): SessionAiPlayerRemoveResult;
  isAiPlayer(sessionId: SessionId, playerId: PlayerId): boolean;
  getSession(sessionId: SessionId): SessionRecord | null;
  listSessions(viewerPlayerId?: PlayerId): SessionSummary[];
  deleteSession(sessionId: SessionId): boolean;
  persist(): void;
}

type SessionIdFactory = () => SessionId;
type SessionFactory = (
  id: SessionId,
  deckSize: SessionDeckSize,
  mode: SessionMode,
  addons: SessionAddon[],
  turnTimerSeconds: SessionTurnTimer
) => SessionRecord;

const defaultSessionIdFactory: SessionIdFactory = () =>
  `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const MAX_PLAYERS = 6;
const DEFAULT_AI_PROFILE: SessionAiProfile = 'randy';
const AI_DISPLAY_NAME: Record<SessionAiProfile, string> = {
  randy: 'RANDY',
  martin: 'MARTIN',
  juan: 'JUAN'
};

const defaultSessionFactory: SessionFactory = (id, deckSize, mode, addons, turnTimerSeconds) => ({
  id,
  deckSize,
  mode,
  addons,
  turnTimerSeconds,
  takeoverBot: DEFAULT_AI_PROFILE,
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
    turnTimerSeconds: SessionTurnTimer = 0,
    addons: SessionAddon[] = []
  ): SessionRecord {
    const id = this.idFactory();
    const session = this.sessionFactory(id, deckSize, mode, addons, turnTimerSeconds);
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

  updateSessionAddons(
    sessionId: SessionId,
    addons: SessionAddon[]
  ): SessionAddonsUpdateResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found.' };
    }

    if (session.gameService.getGame()) {
      return { type: 'error', message: 'Cannot change session add-ons after game start.' };
    }

    session.addons = [...addons];
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

  updateSessionPlayerColor(
    sessionId: SessionId,
    requesterPlayerId: PlayerId,
    targetPlayerId: PlayerId,
    color: PlayerColor
  ): SessionPlayerColorUpdateResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found.' };
    }

    if (session.gameService.getGame()) {
      return { type: 'error', message: 'Cannot change player colors after game start.' };
    }

    if (
      requesterPlayerId !== targetPlayerId &&
      !session.aiPlayerIds.has(targetPlayerId)
    ) {
      return {
        type: 'error',
        message: 'Only bot colors can be changed for other players.'
      };
    }

    const colorResult = session.lobbyService.setPlayerColor(targetPlayerId, color);
    if (colorResult.type === 'error') {
      return { type: 'error', message: colorResult.message };
    }

    this.persist();
    return { type: 'success', session };
  }

  updateSessionTakeoverBot(
    sessionId: SessionId,
    takeoverBot: SessionTakeoverBot
  ): SessionTakeoverBotUpdateResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found.' };
    }

    if (session.gameService.getGame()) {
      return { type: 'error', message: 'Cannot change takeover bot after game start.' };
    }

    session.takeoverBot = takeoverBot;
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

  removeAiPlayer(
    sessionId: SessionId,
    aiPlayerId: PlayerId
  ): SessionAiPlayerRemoveResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { type: 'error', message: 'Session not found.' };
    }

    if (session.gameService.getGame()) {
      return { type: 'error', message: 'Cannot remove AI players after game start.' };
    }

    if (!session.aiPlayerIds.has(aiPlayerId)) {
      return { type: 'error', message: 'AI player not found.' };
    }

    session.lobbyService.leave(aiPlayerId);
    session.aiPlayerIds.delete(aiPlayerId);
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

  listSessions(viewerPlayerId?: PlayerId): SessionSummary[] {
    return Array.from(this.sessions.values()).map((session) =>
      buildSummary(session, viewerPlayerId)
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

function buildSummary(session: SessionRecord, viewerPlayerId?: PlayerId): SessionSummary {
  const lobby = session.lobbyService.getState();
  const game = session.gameService.getGame();
  const status: SessionStatus = game ? 'in_progress' : 'lobby';
  const tileCount = game
    ? game.tileDeck.length + (game.currentTileId ? 1 : 0)
    : buildTileDeck(undefined, session.deckSize, session.addons).length;

  return {
    id: session.id,
    status,
    playerCount: lobby.players.length,
    players: lobby.players.map((player) => {
      const isAi = session.aiPlayerIds.has(player.id);
      if (!isAi) {
        return {
          name: player.name,
          color: player.color ?? 'black',
          ...(player.id === viewerPlayerId ? { isYou: true } : {})
        };
      }

      const aiProfile = inferAiProfile(player.id);
      return {
        name: player.name,
        color: player.color ?? 'black',
        isAi: true,
        aiPlayerId: player.id,
        ...(aiProfile ? { aiProfile } : {})
      };
    }),
    deckSize: session.deckSize,
    mode: session.mode,
    addons: session.addons,
    tileCount,
    turnTimerSeconds: session.turnTimerSeconds,
    takeoverBot: session.takeoverBot
  };
}

function toSnapshot(session: SessionRecord): PersistedSessionSnapshot {
  return {
    id: session.id,
    deckSize: session.deckSize,
    mode: session.mode,
    addons: session.addons,
    turnTimerSeconds: session.turnTimerSeconds,
    takeoverBot: session.takeoverBot,
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
    addons: snapshot.addons,
    turnTimerSeconds: snapshot.turnTimerSeconds,
    takeoverBot: snapshot.takeoverBot,
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
  if (playerId.startsWith('ai-martin-')) {
    return 'martin';
  }
  if (playerId.startsWith('ai-juan-')) {
    return 'juan';
  }

  return undefined;
}

function formatAiName(aiProfile: SessionAiProfile, seatNumber: number): string {
  const label = AI_DISPLAY_NAME[aiProfile] ?? aiProfile.toUpperCase();
  return seatNumber === 1 ? label : `${label} ${seatNumber}`;
}
