/**
 * @description In-memory registry for lobby/game sessions.
 */
import type { SessionId, SessionSummary, SessionStatus } from '@carcassonne/shared';

import type { GameService } from './gameService';
import type { LobbyService } from './lobbyService';
import { InMemoryGameService } from './gameService';
import { InMemoryLobbyService } from './lobbyService';

export interface SessionRecord {
  id: SessionId;
  lobbyService: LobbyService;
  gameService: GameService;
}

export interface SessionService {
  createSession(): SessionRecord;
  getSession(sessionId: SessionId): SessionRecord | null;
  listSessions(): SessionSummary[];
  deleteSession(sessionId: SessionId): boolean;
}

type SessionIdFactory = () => SessionId;
type SessionFactory = (id: SessionId) => SessionRecord;

const defaultSessionIdFactory: SessionIdFactory = () =>
  `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const defaultSessionFactory: SessionFactory = (id) => ({
  id,
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

  createSession(): SessionRecord {
    const id = this.idFactory();
    const session = this.sessionFactory(id);
    this.sessions.set(id, session);
    return session;
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
    playerCount: lobby.players.length
  };
}
