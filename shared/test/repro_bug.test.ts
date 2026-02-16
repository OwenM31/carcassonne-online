import {
  createBoardWithTile,
  isTilePlacementValid,
  PlacedTile
} from '../src';

describe('repro bug', () => {
  it('should not allow RV2_R3C1 at 180 deg south of ABRV2_R1C2', () => {
    const startingTile: PlacedTile = {
      tileId: 'ABRV2_R1C2',
      position: { x: 0, y: 0 },
      orientation: 0
    };
    const board = createBoardWithTile(startingTile);

    // ABRV2_R1C2 edges: N: ROAD, E: RIVER, S: ROAD, W: RIVER
    // RV2_R3C1 edges: N: FARM, E: RIVER, S: FARM, W: RIVER
    // RV2_R3C1 at 180 deg: N: FARM, E: RIVER, S: FARM, W: RIVER
    
    // South of ABRV2_R1C2 (ROAD) meets North of RV2_R3C1 (FARM)
    // This should be FALSE.
    const isValid = isTilePlacementValid(board, 'RV2_R3C1', { x: 0, y: -1 }, 180);
    expect(isValid).toBe(false);
  });
});
