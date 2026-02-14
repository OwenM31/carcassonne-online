import { PlayerId } from './game';

export interface LobbyPlayer {
  id: PlayerId;
  name: string;
}

export interface LobbyState {
  players: LobbyPlayer[];
}
