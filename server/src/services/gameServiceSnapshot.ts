/**
 * @description Serializable snapshot contracts for game service persistence.
 */
import type { GameState, SessionDeckSize, SessionMode } from '@carcassonne/shared';

export interface PersistedGameStartConfig {
  deckSize: SessionDeckSize;
  mode: SessionMode;
}

export interface GameServiceSnapshot {
  game: GameState | null;
  history: GameState[];
  startConfig: PersistedGameStartConfig | null;
}

export function cloneGameServiceSnapshot(snapshot: GameServiceSnapshot): GameServiceSnapshot {
  return structuredClone(snapshot);
}
