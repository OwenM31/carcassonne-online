/**
 * @description In-memory registry for lobby/game sessions.
 */
import type {
  SessionDeckSize,
  SessionId,
  SessionMode,
  SessionSummary,
  SessionStatus
} from '@carcassonne/shared';

import type { GameService } from './gameService';
import type { LobbyService } from './lobbyService';
import { InMemoryGameService } from './gameService';
import { InMemoryLobbyService } from './lobbyService';

export interface SessionRecord {
  id: SessionId;
  deckSize: SessionDeckSize;
  mode: SessionMode;
  lobbyService: LobbyService;
  gameService: GameService;
}

export type SessionDeckSizeUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export type SessionModeUpdateResult =
  | { type: 'success'; session: SessionRecord }
  | { type: 'error'; message: string };

export interface SessionService {
  createSession(deckSize?: SessionDeckSize, mode?: SessionMode): SessionRecord;
  updateSessionDeckSize(
    sessionId: SessionId,
    deckSize: SessionDeckSize
  ): SessionDeckSizeUpdateResult;
  updateSessionMode(sessionId: SessionId, mode: SessionMode): SessionModeUpdateResult;
  getSession(sessionId: SessionId): SessionRecord | null;
  listSessions(): SessionSummary[];
  deleteSession(sessionId: SessionId): boolean;
}

type SessionIdFactory = () => SessionId;
type SessionFactory = (id: SessionId, deckSize: SessionDeckSize, mode: SessionMode) => SessionRecord;

const defaultSessionIdFactory: SessionIdFactory = () =>
  `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const defaultSessionFactory: SessionFactory = (id, deckSize, mode) => ({
  id,
  deckSize,
  mode,
  lobbyService: new InMemoryLobbyService(),
  gameService: new InMemoryGameService()
});

export class InMemorySessionService implements SessionService {
  private sessions = new Map<SessionId, SessionRecord>();
  private idFactory: SessionIdFactory;
  private sessionFactory: SessionFactory;

  constructor(
    idFactory: SessionIdFactory = defaultSessionIdFactory,
    sessionFactory: SessionFactory = defaultSessionFactory
  ) {
    this.idFactory = idFactory;
    this.sessionFactory = sessionFactory;
  }

  createSession(
    deckSize: SessionDeckSize = 'standard',
    mode: SessionMode = 'standard'
  ): SessionRecord {
    const id = this.idFactory();
    const session = this.sessionFactory(id, deckSize, mode);
    this.sessions.set(id, session);
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
    return { type: 'success', session };
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
    return this.sessions.delete(sessionId);
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
    deckSize: session.deckSize,
    mode: session.mode
  };
}
