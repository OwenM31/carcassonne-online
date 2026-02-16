import {
  buildTileDeck,
  getLegalTilePlacements,
  getStartingTileCandidates,
  isRiverAddonTileId,
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
      { id: 'p6', name: 'F' },
      { id: 'p7', name: 'G' }
    ];

    const result = service.startGame(tooManyPlayers);

    expect(result).toEqual({
      type: 'error',
      message: 'Only 6 players are supported.'
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
    expect(result.game.players[0].color).toBe('black');
    expect(result.game.players[1].color).toBe('red');
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

  it('uses River 2 opening and closing sequence in standard mode', () => {
    const service = new InMemoryGameService(() => 'game-river2');
    const result = service.startGame(lobbyPlayers, { addons: ['river_2'] });

    if (result.type !== 'success') {
      throw new Error('Expected River 2 game start to succeed.');
    }

    expect(result.game.startingTileId).toBe('RV2_R1C1');
    expect(result.game.board.tiles['0,0'].tileId).toBe('RV2_R1C1');
    expect(result.game.tileDeck[0]).toBe('RV2_R1C2');

    const firstNonRiverIndex = result.game.tileDeck.findIndex((tileId) => !tileId.startsWith('RV2_'));
    if (firstNonRiverIndex <= 1) {
      throw new Error('Expected River 2 tiles to lead the draw deck.');
    }

    const riverSegment = result.game.tileDeck.slice(0, firstNonRiverIndex);
    expect(riverSegment.slice(-2).sort()).toEqual(['RV2_R3C3', 'RV2_R3C4']);
  });

  it('uses River opening and closing sequence in standard mode', () => {
    const service = new InMemoryGameService(() => 'game-river');
    const result = service.startGame(lobbyPlayers, { addons: ['river'] });

    if (result.type !== 'success') {
      throw new Error('Expected River game start to succeed.');
    }

    expect(result.game.startingTileId).toBe('RV1_R1C1');
    expect(result.game.board.tiles['0,0'].tileId).toBe('RV1_R1C1');
    expect(result.game.tileDeck).not.toContain('RV1_R1C1');

    const firstNonRiverIndex = result.game.tileDeck.findIndex((tileId) => !tileId.startsWith('RV1_'));
    if (firstNonRiverIndex <= 0) {
      throw new Error('Expected River tiles to lead the draw deck.');
    }

    const riverSegment = result.game.tileDeck.slice(0, firstNonRiverIndex);
    expect(riverSegment[riverSegment.length - 1]).toBe('RV1_R3C2');
  });

  it('includes Abbot + River bonus river tile in the opening river segment', () => {
    const service = new InMemoryGameService(() => 'game-river-abbot');
    const result = service.startGame(lobbyPlayers, { addons: ['river', 'abbot'] });

    if (result.type !== 'success') {
      throw new Error('Expected River + Abbot game start to succeed.');
    }

    const firstNonRiverIndex = result.game.tileDeck.findIndex((tileId) => !isRiverAddonTileId(tileId));
    if (firstNonRiverIndex <= 0) {
      throw new Error('Expected River + Abbot river tiles to lead the draw deck.');
    }

    const riverSegment = result.game.tileDeck.slice(0, firstNonRiverIndex);
    expect(riverSegment).toContain('ABRV1_R1C1');
  });

  it('includes Abbot + River 2 bonus river tiles in the opening river segment', () => {
    const service = new InMemoryGameService(() => 'game-river2-abbot');
    const result = service.startGame(lobbyPlayers, { addons: ['river_2', 'abbot'] });

    if (result.type !== 'success') {
      throw new Error('Expected River 2 + Abbot game start to succeed.');
    }

    expect(result.game.tileDeck[0]).toBe('RV2_R1C2');

    const firstNonRiverIndex = result.game.tileDeck.findIndex((tileId) => !isRiverAddonTileId(tileId));
    if (firstNonRiverIndex <= 1) {
      throw new Error('Expected River 2 + Abbot river tiles to lead the draw deck.');
    }

    const riverSegment = result.game.tileDeck.slice(0, firstNonRiverIndex);
    expect(riverSegment).toEqual(expect.arrayContaining(['ABRV2_R1C1', 'ABRV2_R1C2']));
    expect(riverSegment.slice(-2).sort()).toEqual(['RV2_R3C3', 'RV2_R3C4']);
  });

  it('omits River spring/lake tiles when River and River 2 are both enabled', () => {
    const service = new InMemoryGameService(() => 'game-river-combined');
    const result = service.startGame(lobbyPlayers, { addons: ['river', 'river_2'] });

    if (result.type !== 'success') {
      throw new Error('Expected combined river game start to succeed.');
    }

    expect(result.game.startingTileId).toBe('RV2_R1C1');
    expect(result.game.board.tiles['0,0'].tileId).toBe('RV2_R1C1');
    expect(result.game.tileDeck[0]).toBe('RV2_R1C2');
    expect(result.game.tileDeck).not.toContain('RV1_R1C1');
    expect(result.game.tileDeck).not.toContain('RV1_R3C2');

    const firstNonRiverIndex = result.game.tileDeck.findIndex(
      (tileId) => !tileId.startsWith('RV1_') && !tileId.startsWith('RV2_')
    );
    if (firstNonRiverIndex <= 1) {
      throw new Error('Expected combined river tiles to lead the draw deck.');
    }

    const riverSegment = result.game.tileDeck.slice(0, firstNonRiverIndex);
    expect(riverSegment.slice(-2).sort()).toEqual(['RV2_R3C3', 'RV2_R3C4']);
    expect(riverSegment.filter((tileId) => tileId.startsWith('RV1_'))).toHaveLength(10);
  });

  it('keeps base-game starting tile in sandbox mode with River 2 enabled', () => {
    const service = new InMemoryGameService(() => 'game-river2-sandbox');
    const result = service.startGame(lobbyPlayers, { mode: 'sandbox', addons: ['river_2'] });

    if (result.type !== 'success') {
      throw new Error('Expected River 2 sandbox game start to succeed.');
    }

    expect(result.game.startingTileId).toBe(getStartingTileCandidates()[0]);
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

    expect(undo.game).toEqual({ ...initial, canRedo: true });
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

  it('returns drawn tile to deck when draw is undone', () => {
    const service = new InMemoryGameService(() => 'game-undo-draw');
    service.startGame(lobbyPlayers);
    const initialDeck = [...(service.getGame()?.tileDeck ?? [])];
    const drawnTileId = initialDeck[0];

    service.applyAction({ type: 'draw_tile', playerId: 'p1' });
    expect(service.getGame()?.tileDeck).toHaveLength(initialDeck.length - 1);
    expect(service.getGame()?.currentTileId).toBe(drawnTileId);

    service.undo();
    expect(service.getGame()?.tileDeck).toHaveLength(initialDeck.length);
    expect(service.getGame()?.tileDeck[0]).toBe(drawnTileId);
    expect(service.getGame()?.currentTileId).toBeNull();
  });

  it('supports redoing an undone action', () => {
    const service = new InMemoryGameService(() => 'game-redo');
    service.startGame(lobbyPlayers);
    const initial = service.getGame();
    service.applyAction({ type: 'draw_tile', playerId: 'p1' });
    const afterDraw = service.getGame();

    service.undo();
    expect(service.getGame()).toEqual({ ...initial, canRedo: true });

    const redo = service.redo();
    if (redo.type !== 'success') {
      throw new Error('Expected redo to succeed.');
    }
    expect(redo.game).toEqual(afterDraw);
  });

  it('clears redo stack when a new action is applied', () => {
    const service = new InMemoryGameService(() => 'game-redo-clear');
    service.startGame(lobbyPlayers);
    service.applyAction({ type: 'draw_tile', playerId: 'p1' });
    service.undo();
    expect(service.getGame()?.canRedo).toBe(true);

    // Apply a DIFFERENT action (e.g. draw again, which might be the same tile but it's a new action)
    service.applyAction({ type: 'draw_tile', playerId: 'p1' });
    expect(service.getGame()?.canRedo).toBe(false);
    expect(service.redo()).toEqual({ type: 'error', message: 'Nothing to redo.' });
  });
});
