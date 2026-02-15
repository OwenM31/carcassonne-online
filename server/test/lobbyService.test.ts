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

  it('validates locked game rejoin PINs', () => {
    const service = new InMemoryLobbyService();
    service.join('p1', 'Ada', '1234');
    service.lockGameRejoinPins(['p1']);

    expect(service.validateGameRejoin('p1', '1234')).toBe('allowed');
    expect(service.validateGameRejoin('p1', '9999')).toBe('incorrect_passkey');
  });

  it('blocks rejoin when no PIN was set before game start', () => {
    const service = new InMemoryLobbyService();
    service.join('p1', 'Ada');
    service.lockGameRejoinPins(['p1']);

    expect(service.validateGameRejoin('p1', undefined)).toBe('pin_not_set');
  });
});
