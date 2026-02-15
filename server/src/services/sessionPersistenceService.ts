/**
 * @description File-backed persistence for serializing and restoring session snapshots.
 */
import fs from 'fs';
import path from 'path';
import type {
  LobbyState,
  SessionDeckSize,
  SessionId,
  SessionMode,
  SessionTurnTimer
} from '@carcassonne/shared';

import type { GameServiceSnapshot } from './gameServiceSnapshot';

export interface PersistedSessionSnapshot {
  id: SessionId;
  deckSize: SessionDeckSize;
  mode: SessionMode;
  turnTimerSeconds: SessionTurnTimer;
  lobby: LobbyState;
  lobbyPinHashes: Record<string, string | null>;
  gameRejoinPinHashes: Record<string, string | null>;
  game: GameServiceSnapshot;
}

export interface SessionPersistenceService {
  loadSessions(): PersistedSessionSnapshot[];
  saveSessions(sessions: PersistedSessionSnapshot[]): void;
}

export class FileSessionPersistenceService implements SessionPersistenceService {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  loadSessions(): PersistedSessionSnapshot[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      return decodeSnapshots(parsed);
    } catch {
      return [];
    }
  }

  saveSessions(sessions: PersistedSessionSnapshot[]): void {
    const directory = path.dirname(this.filePath);
    fs.mkdirSync(directory, { recursive: true });

    const tempPath = `${this.filePath}.tmp`;
    const payload = JSON.stringify(sessions, null, 2);
    fs.writeFileSync(tempPath, payload, 'utf8');
    fs.renameSync(tempPath, this.filePath);
  }
}

function decodeSnapshots(value: unknown): PersistedSessionSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const snapshots: PersistedSessionSnapshot[] = [];
  value.forEach((entry) => {
    if (!isRecord(entry)) {
      return;
    }

    const turnTimerSeconds = isSessionTurnTimer(entry.turnTimerSeconds)
      ? entry.turnTimerSeconds
      : 60;
    const lobbyPinHashes = isNullableStringRecord(entry.lobbyPinHashes)
      ? entry.lobbyPinHashes
      : {};
    const gameRejoinPinHashes = isNullableStringRecord(entry.gameRejoinPinHashes)
      ? entry.gameRejoinPinHashes
      : {};

    if (
      typeof entry.id !== 'string' ||
      !isSessionDeckSize(entry.deckSize) ||
      !isSessionMode(entry.mode) ||
      !isLobbyState(entry.lobby) ||
      !isGameSnapshot(entry.game)
    ) {
      return;
    }

    snapshots.push({
      id: entry.id,
      deckSize: entry.deckSize,
      mode: entry.mode,
      turnTimerSeconds,
      lobby: entry.lobby,
      lobbyPinHashes,
      gameRejoinPinHashes,
      game: entry.game
    });
  });

  return snapshots;
}

function isSessionDeckSize(value: unknown): value is SessionDeckSize {
  return value === 'standard' || value === 'small';
}

function isSessionMode(value: unknown): value is SessionMode {
  return value === 'standard' || value === 'sandbox';
}

function isSessionTurnTimer(value: unknown): value is SessionTurnTimer {
  return value === 0 || value === 30 || value === 60 || value === 90;
}

function isLobbyState(value: unknown): value is LobbyState {
  if (!isRecord(value) || !Array.isArray(value.players)) {
    return false;
  }

  return value.players.every((player) => {
    return isRecord(player) && typeof player.id === 'string' && typeof player.name === 'string';
  });
}

function isGameSnapshot(value: unknown): value is GameServiceSnapshot {
  if (
    !isRecord(value) ||
    !('game' in value) ||
    !('history' in value) ||
    !Array.isArray(value.history)
  ) {
    return false;
  }

  const startConfig = value.startConfig;
  if (startConfig !== null && startConfig !== undefined) {
    if (
      !isRecord(startConfig) ||
      !isSessionDeckSize(startConfig.deckSize) ||
      !isSessionMode(startConfig.mode) ||
      (startConfig.turnTimerSeconds !== undefined &&
        !isSessionTurnTimer(startConfig.turnTimerSeconds))
    ) {
      return false;
    }
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableStringRecord(value: unknown): value is Record<string, string | null> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((entry) => entry === null || typeof entry === 'string');
}
