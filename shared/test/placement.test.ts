import {
  createBoardWithTile,
  getLegalTilePlacements,
  isTilePlacementValid,
  type PlacedTile
} from '../src';

describe('tile placement validation', () => {
  const startingTile: PlacedTile = {
    tileId: 'T_R3C4',
    position: { x: 0, y: 0 },
    orientation: 0
  };

  const makeBoard = () => createBoardWithTile(startingTile);

  it('rejects placements with no adjacent neighbors', () => {
    const board = makeBoard();

    expect(
      isTilePlacementValid(board, 'T_R3C5', { x: 2, y: 0 }, 0)
    ).toBe(false);
  });

  it('rejects placements with mismatched edges', () => {
    const board = makeBoard();

    expect(
      isTilePlacementValid(board, 'T_R3C5', { x: 0, y: -1 }, 0)
    ).toBe(false);
  });

  it('accepts a rotated placement when edges match', () => {
    const board = makeBoard();

    expect(
      isTilePlacementValid(board, 'T_R3C5', { x: 1, y: 0 }, 0)
    ).toBe(false);
    expect(
      isTilePlacementValid(board, 'T_R3C5', { x: 1, y: 0 }, 90)
    ).toBe(true);
  });

  it('returns all legal placements for a tile', () => {
    const board = makeBoard();

    const placements = getLegalTilePlacements(board, 'T_R3C5');

    const expected = [
      { position: { x: 1, y: 0 }, orientation: 90 },
      { position: { x: 1, y: 0 }, orientation: 270 },
      { position: { x: -1, y: 0 }, orientation: 90 },
      { position: { x: -1, y: 0 }, orientation: 270 },
      { position: { x: 0, y: -1 }, orientation: 90 },
      { position: { x: 0, y: -1 }, orientation: 270 }
    ];

    expect(placements).toHaveLength(expected.length);

    for (const option of expected) {
      expect(placements).toContainEqual(option);
    }
  });
});
