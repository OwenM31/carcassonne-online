import type { LobbyState, PlayerId } from '@carcassonne/shared';

export interface LobbyService {
  join(playerId: PlayerId, playerName: string): LobbyState;
  leave(playerId: PlayerId): LobbyState;
  getState(): LobbyState;
}

export class InMemoryLobbyService implements LobbyService {
  private players = new Map<PlayerId, { id: PlayerId; name: string }>();

  constructor(initialState: LobbyState | null = null) {
    initialState?.players.forEach((player) => {
      this.players.set(player.id, { id: player.id, name: player.name });
    });
  }

  join(playerId: PlayerId, playerName: string): LobbyState {
    this.players.set(playerId, { id: playerId, name: playerName });
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
}
