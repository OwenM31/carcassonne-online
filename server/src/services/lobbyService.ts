import { createHash } from 'crypto';
import type { LobbyState, PlayerId } from '@carcassonne/shared';

export type RejoinValidationResult = 'allowed' | 'incorrect_passkey' | 'pin_not_set';

export interface LobbyService {
  join(playerId: PlayerId, playerName: string, playerPin?: string): LobbyState;
  leave(playerId: PlayerId): LobbyState;
  getState(): LobbyState;
  lockGameRejoinPins(playerIds: PlayerId[]): void;
  clearGameRejoinPins(): void;
  validateGameRejoin(playerId: PlayerId, playerPin?: string): RejoinValidationResult;
  getPlayerPinHashes(): Record<PlayerId, string | null>;
  getGameRejoinPinHashes(): Record<PlayerId, string | null>;
}

export class InMemoryLobbyService implements LobbyService {
  private players = new Map<PlayerId, { id: PlayerId; name: string }>();
  private playerPinHashById = new Map<PlayerId, string | null>();
  private gameRejoinPinHashById = new Map<PlayerId, string | null>();

  constructor(
    initialState: LobbyState | null = null,
    playerPinHashes: Record<PlayerId, string | null> = {},
    gameRejoinPinHashes: Record<PlayerId, string | null> = {}
  ) {
    initialState?.players.forEach((player) => {
      this.players.set(player.id, { id: player.id, name: player.name });
    });
    Object.entries(playerPinHashes).forEach(([playerId, pinHash]) => {
      this.playerPinHashById.set(playerId, pinHash ?? null);
    });
    Object.entries(gameRejoinPinHashes).forEach(([playerId, pinHash]) => {
      this.gameRejoinPinHashById.set(playerId, pinHash ?? null);
    });
  }

  join(playerId: PlayerId, playerName: string, playerPin?: string): LobbyState {
    this.players.set(playerId, { id: playerId, name: playerName });
    const pinHash = parsePlayerPinHash(playerPin);
    if (pinHash !== undefined) {
      this.playerPinHashById.set(playerId, pinHash);
    } else if (!this.playerPinHashById.has(playerId)) {
      this.playerPinHashById.set(playerId, null);
    }

    return this.getState();
  }

  leave(playerId: PlayerId): LobbyState {
    this.players.delete(playerId);
    return this.getState();
  }

  getState(): LobbyState {
    return {
      players: Array.from(this.players.values())
    };
  }

  lockGameRejoinPins(playerIds: PlayerId[]): void {
    this.gameRejoinPinHashById.clear();
    playerIds.forEach((playerId) => {
      this.gameRejoinPinHashById.set(playerId, this.playerPinHashById.get(playerId) ?? null);
    });
  }

  clearGameRejoinPins(): void {
    this.gameRejoinPinHashById.clear();
  }

  validateGameRejoin(playerId: PlayerId, playerPin?: string): RejoinValidationResult {
    if (!this.gameRejoinPinHashById.has(playerId)) {
      return 'incorrect_passkey';
    }

    const expectedHash = this.gameRejoinPinHashById.get(playerId);
    if (!expectedHash) {
      return 'pin_not_set';
    }

    const incomingHash = parsePlayerPinHash(playerPin);
    if (!incomingHash || incomingHash !== expectedHash) {
      return 'incorrect_passkey';
    }

    return 'allowed';
  }

  getPlayerPinHashes(): Record<PlayerId, string | null> {
    return Object.fromEntries(this.playerPinHashById.entries());
  }

  getGameRejoinPinHashes(): Record<PlayerId, string | null> {
    return Object.fromEntries(this.gameRejoinPinHashById.entries());
  }
}

function parsePlayerPinHash(playerPin: string | undefined): string | null | undefined {
  if (playerPin === undefined) {
    return undefined;
  }

  const normalizedPin = playerPin.trim();
  if (!normalizedPin) {
    return null;
  }

  return createHash('sha256').update(normalizedPin).digest('hex');
}
