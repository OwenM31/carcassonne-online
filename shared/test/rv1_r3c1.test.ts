
import { analyzeBoardFeatures } from '../src/rules/featureAnalysis';
import { createBoardWithTile } from '../src/rules/board';
import { FULL_TILE_CATALOG } from '../src/tiles/catalog';

describe('RV1_R3C1 analysis', () => {
  it('should have 4 separate fields', () => {
    const board = createBoardWithTile({
      tileId: 'RV1_R3C1',
      position: { x: 0, y: 0 },
      orientation: 0
    });
    
    const analysis = analyzeBoardFeatures(board);
    const farms = analysis.components.filter(c => c.type === 'farm');
    
    expect(farms.length).toBe(4);
    expect(analysis.summary.grasslands).toBe(4);
  });
});
