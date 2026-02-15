import {
  buildTileDeck,
  getLegalTilePlacements,
  getStartingTileCandidates,
  type LobbyPlayer
} from '@carcassonne/shared';
import { InMemoryGameService } from '../src/services/gameService';

describe('InMemoryGameService', () => {
  const lobbyPlayers: LobbyPlayer[] = [
    { id: 'p1', name: 'Ada' },
    { id: 'p2', name: 'Linus' }
  ];

  it('rejects games with fewer than two players', () => {
    const service = new InMemoryGameService(() => 'game-1');

    const result = service.startGame([lobbyPlayers[0]]);

    expect(result).toEqual({
      type: 'error',
      message: 'At least 2 players are required to start.'
    });
  });

  it('rejects games with too many players', () => {
    const service = new InMemoryGameService(() => 'game-2');
    const tooManyPlayers: LobbyPlayer[] = [
      { id: 'p1', name: 'A' },
      { id: 'p2', name: 'B' },
      { id: 'p3', name: 'C' },
      { id: 'p4', name: 'D' },
      { id: 'p5', name: 'E' },
      { id: 'p6', name: 'F' }
    ];

    const result = service.startGame(tooManyPlayers);

    expect(result).toEqual({
      type: 'error',
      message: 'Only 5 players are supported.'
    });
  });

  it('creates a game with a starting tile and assigned colors', () => {
    const service = new InMemoryGameService(() => 'game-3');

    const result = service.startGame(lobbyPlayers);

    if (result.type !== 'success') {
      throw new Error('Expected a successful game start.');
    }

    const startingTiles = getStartingTileCandidates();
    const startingTileId = startingTiles[0];

    expect(result.game.id).toBe('game-3');
    expect(result.game.players).toHaveLength(2);
    expect(result.game.players[0].color).toBe('red');
    expect(result.game.players[1].color).toBe('blue');
    expect(result.game.startingTileId).toBe(startingTileId);
    expect(result.game.board.tiles['0,0'].tileId).toBe(startingTileId);

    const expectedDeckLength = buildTileDeck().length - 1;
    expect(result.game.tileDeck).toHaveLength(expectedDeckLength);
  });

  it('creates a game with small deck sizing when selected', () => {
    const service = new InMemoryGameService(() => 'game-small');
    const result = service.startGame(lobbyPlayers, { deckSize: 'small' });

    if (result.type !== 'success') {
      throw new Error('Expected a successful game start.');
    }

    const expectedDeckLength = buildTileDeck(undefined, 'small').length - 1;
    expect(result.game.tileDeck).toHaveLength(expectedDeckLength);
  });

  it('allows single-player starts in sandbox mode', () => {
    const service = new InMemoryGameService(() => 'game-sandbox');
    const result = service.startGame([lobbyPlayers[0]], { mode: 'sandbox' });

    if (result.type !== 'success') {
      throw new Error('Expected sandbox game start to succeed.');
    }

    expect(result.game.mode).toBe('sandbox');
    expect(result.game.players).toHaveLength(1);
  });

  it('prevents starting multiple games', () => {
    const service = new InMemoryGameService(() => 'game-4');

    const first = service.startGame(lobbyPlayers);
    const second = service.startGame(lobbyPlayers);

    expect(first.type).toBe('success');
    expect(second).toEqual({
      type: 'error',
      message: 'Game already started.'
    });
  });

  it('applies draw and placement actions for the active player', () => {
    const service = new InMemoryGameService(() => 'game-5');
    const start = service.startGame(lobbyPlayers);

    if (start.type !== 'success') {
      throw new Error('Expected a successful game start.');
    }

    const draw = service.applyAction({ type: 'draw_tile', playerId: 'p1' });

    if (draw.type !== 'success' || !draw.game.currentTileId) {
      throw new Error('Expected draw_tile to succeed.');
    }

    const placements = getLegalTilePlacements(
      draw.game.board,
      draw.game.currentTileId
    );
    const placement = placements[0];

    const place = service.applyAction({
      type: 'place_tile',
      playerId: 'p1',
      tileId: draw.game.currentTileId,
      position: placement.position,
      orientation: placement.orientation
    });

    expect(place.type).toBe('success');
  });

  it('rejects actions from non-active players', () => {
    const service = new InMemoryGameService(() => 'game-6');
    const start = service.startGame(lobbyPlayers);

    if (start.type !== 'success') {
      throw new Error('Expected a successful game start.');
    }

    const result = service.applyAction({ type: 'draw_tile', playerId: 'p2' });

    expect(result).toEqual({
      type: 'error',
      message: 'Only the active player can act.'
    });
  });

  it('undoes the most recent successful action', () => {
    const service = new InMemoryGameService(() => 'game-7');
    const start = service.startGame(lobbyPlayers);

    if (start.type !== 'success') {
      throw new Error('Expected a successful game start.');
    }

    const initial = service.getGame();
    const draw = service.applyAction({ type: 'draw_tile', playerId: 'p1' });

    if (!initial || draw.type !== 'success') {
      throw new Error('Expected draw_tile to succeed.');
    }

    const undo = service.undo();

    if (undo.type !== 'success') {
      throw new Error('Expected undo to succeed.');
    }

    expect(undo.game).toEqual(initial);
  });

  it('returns an error when there is nothing to undo', () => {
    const service = new InMemoryGameService(() => 'game-8');
    const start = service.startGame(lobbyPlayers);

    if (start.type !== 'success') {
      throw new Error('Expected a successful game start.');
    }

    const result = service.undo();

    expect(result).toEqual({
      type: 'error',
      message: 'Nothing to undo.'
    });
  });

  it('resets sandbox boards with a refilled deck', () => {
    const service = new InMemoryGameService(() => 'game-9');
    const start = service.startGame(lobbyPlayers, { deckSize: 'small', mode: 'sandbox' });

    if (start.type !== 'success') {
      throw new Error('Expected sandbox game start to succeed.');
    }

    const tileId = start.game.tileDeck[0];
    if (!tileId) {
      throw new Error('Expected at least one tile in deck.');
    }

    const draw = service.applyAction({ type: 'draw_sandbox_tile', playerId: 'p1', tileId });
    if (draw.type !== 'success') {
      throw new Error('Expected draw_sandbox_tile to succeed.');
    }

    const reset = service.resetSandboxBoard('p1');
    if (reset.type !== 'success') {
      throw new Error('Expected sandbox reset to succeed.');
    }

    expect(reset.game.turnNumber).toBe(1);
    expect(Object.keys(reset.game.board.tiles)).toHaveLength(1);
    expect(reset.game.tileDeck).toHaveLength(buildTileDeck(undefined, 'small').length - 1);
    expect(service.undo()).toEqual({ type: 'error', message: 'Nothing to undo.' });
  });

  it('rejects sandbox reset in standard mode', () => {
    const service = new InMemoryGameService(() => 'game-10');
    const start = service.startGame(lobbyPlayers);
    if (start.type !== 'success') {
      throw new Error('Expected standard game start to succeed.');
    }

    expect(service.resetSandboxBoard('p1')).toEqual({
      type: 'error',
      message: 'Sandbox board reset is only available in sandbox mode.'
    });
  });

  it('rejects sandbox reset from non-active players', () => {
    const service = new InMemoryGameService(() => 'game-11');
    const start = service.startGame(lobbyPlayers, { mode: 'sandbox' });
    if (start.type !== 'success') {
      throw new Error('Expected sandbox game start to succeed.');
    }

    expect(service.resetSandboxBoard('p2')).toEqual({
      type: 'error',
      message: 'Only the active player can act.'
    });
  });
});
