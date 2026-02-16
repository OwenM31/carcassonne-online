import { createHash } from 'crypto';
import type { LobbyState, PlayerColor, PlayerId } from '@carcassonne/shared';

export type RejoinValidationResult = 'allowed' | 'incorrect_passkey' | 'pin_not_set';
export type LobbyColorUpdateResult =
  | { type: 'success'; lobby: LobbyState }
  | { type: 'error'; message: string };

const PLAYER_COLORS: PlayerColor[] = ['black', 'red', 'yellow', 'green', 'blue', 'gray', 'pink'];

export interface LobbyService {
  join(playerId: PlayerId, playerName: string, playerPin?: string): LobbyState;
  leave(playerId: PlayerId): LobbyState;
  setPlayerColor(playerId: PlayerId, color: PlayerColor): LobbyColorUpdateResult;
  getState(): LobbyState;
  lockGameRejoinPins(playerIds: PlayerId[]): void;
  clearGameRejoinPins(): void;
  validateGameRejoin(playerId: PlayerId, playerPin?: string): RejoinValidationResult;
  getPlayerPinHashes(): Record<PlayerId, string | null>;
  getGameRejoinPinHashes(): Record<PlayerId, string | null>;
}

export class InMemoryLobbyService implements LobbyService {
  private players = new Map<PlayerId, { id: PlayerId; name: string; color: PlayerColor }>();
  private playerPinHashById = new Map<PlayerId, string | null>();
  private gameRejoinPinHashById = new Map<PlayerId, string | null>();

  constructor(
    initialState: LobbyState | null = null,
    playerPinHashes: Record<PlayerId, string | null> = {},
    gameRejoinPinHashes: Record<PlayerId, string | null> = {}
  ) {
    initialState?.players.forEach((player, index) => {
      this.players.set(player.id, {
        id: player.id,
        name: player.name,
        color: resolvePlayerColor(player.color, this.players, index)
      });
    });
    Object.entries(playerPinHashes).forEach(([playerId, pinHash]) => {
      this.playerPinHashById.set(playerId, pinHash ?? null);
    });
    Object.entries(gameRejoinPinHashes).forEach(([playerId, pinHash]) => {
      this.gameRejoinPinHashById.set(playerId, pinHash ?? null);
    });
  }

  join(playerId: PlayerId, playerName: string, playerPin?: string): LobbyState {
    const existing = this.players.get(playerId);
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      color: existing?.color ?? firstAvailableColor(this.players)
    });
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

  setPlayerColor(playerId: PlayerId, color: PlayerColor): LobbyColorUpdateResult {
    const target = this.players.get(playerId);
    if (!target) {
      return { type: 'error', message: 'Player not found in lobby.' };
    }

    const isColorUsed = Array.from(this.players.values()).some(
      (player) => player.id !== playerId && player.color === color
    );
    if (isColorUsed) {
      return { type: 'error', message: 'Color is already taken.' };
    }

    this.players.set(playerId, { ...target, color });
    return { type: 'success', lobby: this.getState() };
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

function firstAvailableColor(
  players: Map<PlayerId, { id: PlayerId; name: string; color: PlayerColor }>
): PlayerColor {
  const used = new Set(Array.from(players.values()).map((player) => player.color));
  return PLAYER_COLORS.find((color) => !used.has(color)) ?? PLAYER_COLORS[0];
}

function resolvePlayerColor(
  color: PlayerColor | undefined,
  players: Map<PlayerId, { id: PlayerId; name: string; color: PlayerColor }>,
  fallbackIndex: number
): PlayerColor {
  if (color && !Array.from(players.values()).some((player) => player.color === color)) {
    return color;
  }

  return firstAvailableColor(players) ?? PLAYER_COLORS[fallbackIndex % PLAYER_COLORS.length];
}
