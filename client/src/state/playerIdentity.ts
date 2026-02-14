/**
 * @description Helpers for creating and storing player identities.
 */
const PLAYER_ID_STORAGE_KEY = 'carcassonne.playerId';

export function loadOrCreatePlayerId(): string {
  if (typeof window === 'undefined') {
    return createPlayerId();
  }

  const stored = readFromSessionStorage();
  if (stored) {
    return stored;
  }

  const playerId = createPlayerId();
  writeToSessionStorage(playerId);

  return playerId;
}

export function createPlayerId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readFromSessionStorage(): string | null {
  try {
    return window.sessionStorage.getItem(PLAYER_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToSessionStorage(playerId: string): void {
  try {
    window.sessionStorage.setItem(PLAYER_ID_STORAGE_KEY, playerId);
  } catch {
    // Ignore storage failures and fall back to an in-memory id.
  }
}
