import { PlayerColor, PlayerId } from './game';

export interface LobbyPlayer {
  id: PlayerId;
  name: string;
  color?: PlayerColor;
}

export interface LobbyState {
  players: LobbyPlayer[];
}
