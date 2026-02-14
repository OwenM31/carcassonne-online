import { InMemoryLobbyService } from '../src/services/lobbyService';

describe('InMemoryLobbyService', () => {
  it('adds players on join', () => {
    const service = new InMemoryLobbyService();
    const state = service.join('p1', 'Ada');

    expect(state.players).toEqual([{ id: 'p1', name: 'Ada' }]);
  });

  it('updates the player name on rejoin', () => {
    const service = new InMemoryLobbyService();
    service.join('p1', 'Ada');

    const state = service.join('p1', 'Grace');

    expect(state.players).toEqual([{ id: 'p1', name: 'Grace' }]);
  });

  it('removes players on leave', () => {
    const service = new InMemoryLobbyService();
    service.join('p1', 'Ada');
    service.join('p2', 'Grace');

    const state = service.leave('p1');

    expect(state.players).toEqual([{ id: 'p2', name: 'Grace' }]);
  });
});
