
import { analyzeBoardFeatures } from '../src/rules/featureAnalysis';
import { createBoardWithTile, addTileToBoard } from '../src/rules/board';

describe('RV1_R3C1 merging bug', () => {
  it('should not merge farms through a ROAD edge', () => {
    // RV1_R3C1 at (0,0), N is ROAD.
    // T_R3C4 at (0,1), S is FARM, but N is CITY, E/W are ROAD.
    // Wait, T_R3C4 (city_road_straight) orientation 0: N: CITY, E: ROAD, S: FARM, W: ROAD.
    // If we rotate T_R3C4 to orientation 180: N: FARM, E: ROAD, S: CITY, W: ROAD.
    // Still doesn't match ROAD at (0,0) North.
    
    // Let's use T_R3C5 (road_straight): N: ROAD, E: FARM, S: ROAD, W: FARM.
    // (0,0): RV1_R3C1 (0) -> N: ROAD, E: RIVER, S: ROAD, W: RIVER.
    // (0,1): T_R3C5 (0) -> N: ROAD, E: FARM, S: ROAD, W: FARM.
    // Interface (0,0)N and (0,1)S are both ROAD. They match.
    
    let board = createBoardWithTile({
      tileId: 'RV1_R3C1',
      position: { x: 0, y: 0 },
      orientation: 0
    });
    
    board = addTileToBoard(board, {
      tileId: 'T_R3C5',
      position: { x: 0, y: 1 },
      orientation: 0
    });
    
    const analysis = analyzeBoardFeatures(board);
    
    // RV1_R3C1 has 4 farms (0, 1, 2, 3).
    // T_R3C5 has 2 farms (0: NW+SW, 1: NE+SE).
    // T_R3C5 North is ROAD, South is ROAD.
    // In T_R3C5 orientation 0:
    // Farm 0 (W side) is adjacent to N, S, W.
    // Farm 1 (E side) is adjacent to N, S, E.
    
    // If ROAD doesn't block, T_R3C5 Farm 0 will connect to RV1_R3C1 Farm 0 (NW) via S->N.
    // And T_R3C5 Farm 1 will connect to RV1_R3C1 Farm 1 (NE) via S->N.
    
    // But wait, T_R3C5 only has ONE road, so the two farms are already separate.
    // If they connect to RV1_R3C1, they stay separate.
    
    // To see a MERGE, we need a tile that has one farm but meeting two edges.
    // T_R1C2 (monastery road) orientation 0: N: FARM, E: FARM, S: ROAD, W: FARM.
    // Its single farm is adjacent to N, E, W AND S (both sides of the road).
    
    board = createBoardWithTile({
      tileId: 'RV1_R3C1',
      position: { x: 0, y: 0 },
      orientation: 0
    });
    board = addTileToBoard(board, {
      tileId: 'T_R1C2',
      position: { x: 0, y: 1 },
      orientation: 0
    });
    
    const analysis2 = analyzeBoardFeatures(board);
    
    // T_R1C2 has one farm node.
    // If it connects to both RV1_R3C1 Farm 0 and Farm 1, then they are merged.
    const farm0Key = '0,0:farm:0';
    const farm1Key = '0,0:farm:1';
    
    const comp0 = analysis2.componentByFeatureKey[farm0Key];
    const comp1 = analysis2.componentByFeatureKey[farm1Key];
    
    expect(comp0).not.toBe(comp1);
  });
});
