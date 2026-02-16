/**
 * @description File-backed persistence for serializing and restoring session snapshots.
 */
import fs from 'fs';
import path from 'path';
import {
  SESSION_ADDONS,
  type LobbyState,
  type PlayerColor,
  type SessionAddon,
  type SessionDeckSize,
  type SessionId,
  type SessionMode,
  type SessionTakeoverBot,
  type SessionTurnTimer
} from '@carcassonne/shared';

import type { GameServiceSnapshot } from './gameServiceSnapshot';

export interface PersistedSessionSnapshot {
  id: SessionId;
  deckSize: SessionDeckSize;
  mode: SessionMode;
  addons: SessionAddon[];
  turnTimerSeconds: SessionTurnTimer;
  takeoverBot: SessionTakeoverBot;
  aiPlayerIds: string[];
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
      : 0;
    const takeoverBot = isSessionTakeoverBot(entry.takeoverBot)
      ? entry.takeoverBot
      : 'randy';
    const lobbyPinHashes = isNullableStringRecord(entry.lobbyPinHashes)
      ? entry.lobbyPinHashes
      : {};
    const gameRejoinPinHashes = isNullableStringRecord(entry.gameRejoinPinHashes)
      ? entry.gameRejoinPinHashes
      : {};
    const aiPlayerIds = isStringArray(entry.aiPlayerIds) ? entry.aiPlayerIds : [];
    const addons = isSessionAddons(entry.addons) ? entry.addons : [];

    const lobby = decodeLobbyState(entry.lobby);
    if (
      typeof entry.id !== 'string' ||
      !isSessionDeckSize(entry.deckSize) ||
      !isSessionMode(entry.mode) ||
      !lobby ||
      !isGameSnapshot(entry.game)
    ) {
      return;
    }

    snapshots.push({
      id: entry.id,
      deckSize: entry.deckSize,
      mode: entry.mode,
      addons,
      turnTimerSeconds,
      takeoverBot,
      aiPlayerIds,
      lobby,
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

function isSessionTakeoverBot(value: unknown): value is SessionTakeoverBot {
  return value === 'randy' || value === 'martin' || value === 'juan';
}

function isSessionAddons(value: unknown): value is SessionAddon[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === 'string' && SESSION_ADDONS.includes(entry as SessionAddon)) &&
    new Set(value).size === value.length
  );
}

function decodeLobbyState(value: unknown): LobbyState | null {
  if (!isRecord(value) || !Array.isArray(value.players)) {
    return null;
  }

  const usedColors = new Set<PlayerColor>();
  const players = value.players.map((player, index) => {
    if (!isRecord(player) || typeof player.id !== 'string' || typeof player.name !== 'string') {
      return null;
    }

    const color = resolvePlayerColor(player.color, usedColors, index);
    usedColors.add(color);
    return { id: player.id, name: player.name, color };
  });

  if (players.some((player) => !player)) {
    return null;
  }

  return {
    players: players as LobbyState['players']
  };
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
      (startConfig.addons !== undefined && !isSessionAddons(startConfig.addons)) ||
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

const PLAYER_COLORS: PlayerColor[] = ['black', 'red', 'yellow', 'green', 'blue', 'gray', 'pink'];

function resolvePlayerColor(
  rawColor: unknown,
  usedColors: Set<PlayerColor>,
  fallbackIndex: number
): PlayerColor {
  if (isPlayerColor(rawColor) && !usedColors.has(rawColor)) {
    return rawColor;
  }

  return (
    PLAYER_COLORS.find((color) => !usedColors.has(color)) ??
    PLAYER_COLORS[fallbackIndex % PLAYER_COLORS.length]
  );
}

function isPlayerColor(value: unknown): value is PlayerColor {
  return (
    value === 'black' ||
    value === 'red' ||
    value === 'yellow' ||
    value === 'green' ||
    value === 'blue' ||
    value === 'gray' ||
    value === 'pink'
  );
}
