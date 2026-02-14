/**
 * @description Unit tests for connected feature analysis.
 */
import { addTileToBoard, analyzeBoardFeatures, createBoardWithTile } from '../src';

describe('analyzeBoardFeatures', () => {
  it('counts a closed road that connects two monastery-road termini', () => {
    const board = addTileToBoard(
      createBoardWithTile({
        tileId: 'T_R1C2',
        position: { x: 0, y: 0 },
        orientation: 0
      }),
      {
        tileId: 'T_R1C2',
        position: { x: 0, y: -1 },
        orientation: 180
      }
    );

    const summary = analyzeBoardFeatures(board).summary;

    expect(summary.roads.total).toBe(1);
    expect(summary.roads.closed).toBe(1);
    expect(summary.roads.open).toBe(0);
    expect(summary.monasteries).toBe(2);
  });

  it('counts a closed city made from two city-cap tiles', () => {
    const board = addTileToBoard(
      createBoardWithTile({
        tileId: 'T_R2C8',
        position: { x: 0, y: 0 },
        orientation: 0
      }),
      {
        tileId: 'T_R2C8',
        position: { x: 0, y: 1 },
        orientation: 180
      }
    );

    const summary = analyzeBoardFeatures(board).summary;

    expect(summary.cities.total).toBe(1);
    expect(summary.cities.closed).toBe(1);
    expect(summary.cities.open).toBe(0);
  });
});
