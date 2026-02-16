
import { analyzeBoardFeatures } from '../src/rules/featureAnalysis';
import { createBoardWithTile } from '../src/rules/board';

describe('RV1_R3C1 orientations', () => {
  it('should have 4 separate fields in all orientations', () => {
    [0, 90, 180, 270].forEach((orientation) => {
      const board = createBoardWithTile({
        tileId: 'RV1_R3C1',
        position: { x: 0, y: 0 },
        orientation: orientation as any
      });
      
      const analysis = analyzeBoardFeatures(board);
      const farms = analysis.components.filter(c => c.type === 'farm');
      
      expect(farms.length).toBe(4);
    });
  });
});
