/**
 * @description Integration tests for file-backed session persistence.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

import { InMemorySessionService } from '../src/services/sessionService';
import { FileSessionPersistenceService } from '../src/services/sessionPersistenceService';

describe('FileSessionPersistenceService', () => {
  it('restores sessions, lobby players, and active games after restart', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carc-session-'));
    const stateFile = path.join(tempDir, 'sessions.json');
    const persistence = new FileSessionPersistenceService(stateFile);

    const service = new InMemorySessionService(() => 'session-1', undefined, persistence);
    const session = service.createSession('small', 'sandbox', 90);

    session.lobbyService.join('p1', 'Ada');
    session.lobbyService.join('p2', 'Grace');
    const started = session.gameService.startGame([
      { id: 'p1', name: 'Ada' },
      { id: 'p2', name: 'Grace' }
    ], { deckSize: 'small', mode: 'sandbox' });

    expect(started.type).toBe('success');

    service.persist();

    const restored = new InMemorySessionService(() => 'session-next', undefined, persistence);
    const [summary] = restored.listSessions();

    expect(summary).toEqual({
      id: 'session-1',
      status: 'in_progress',
      playerCount: 2,
      players: [{ name: 'Ada' }, { name: 'Grace' }],
      deckSize: 'small',
      mode: 'sandbox',
      turnTimerSeconds: 90,
      takeoverBot: 'randy'
    });

    const restoredSession = restored.getSession('session-1');
    expect(restoredSession).not.toBeNull();
    expect(restoredSession?.gameService.getGame()).not.toBeNull();
  });

  it('updates persisted storage on delete', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carc-session-'));
    const stateFile = path.join(tempDir, 'sessions.json');
    const persistence = new FileSessionPersistenceService(stateFile);

    const service = new InMemorySessionService(() => 'session-2', undefined, persistence);
    service.createSession();
    service.deleteSession('session-2');

    const restored = new InMemorySessionService(() => 'session-next', undefined, persistence);
    expect(restored.listSessions()).toEqual([]);
  });

  it('persists configured AI seats and takeover bot', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carc-session-'));
    const stateFile = path.join(tempDir, 'sessions.json');
    const persistence = new FileSessionPersistenceService(stateFile);
    const service = new InMemorySessionService(() => 'session-3', undefined, persistence);

    service.createSession();
    service.addAiPlayer('session-3', 'martin');
    service.updateSessionTakeoverBot('session-3', 'martin');
    service.persist();

    const restored = new InMemorySessionService(() => 'session-next', undefined, persistence);
    expect(restored.listSessions()).toEqual([
      {
        id: 'session-3',
        status: 'lobby',
        playerCount: 1,
        players: [{ name: 'MARTIN', isAi: true, aiProfile: 'martin' }],
        deckSize: 'standard',
        mode: 'standard',
        turnTimerSeconds: 60,
        takeoverBot: 'martin'
      }
    ]);
  });
});
