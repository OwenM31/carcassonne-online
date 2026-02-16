/**
 * @description Unit tests for meeple anchor positioning on tiles.
 */
import type { MeeplePlacement, PlacedTile } from '@carcassonne/shared';

import { getMeepleAnchor, getMeepleRoleLabel } from '../src/state/meepleLayout';

describe('meepleLayout', () => {
  it('positions monastery meeples at the tile center', () => {
    const tile: PlacedTile = {
      tileId: 'T_R1C1',
      position: { x: 0, y: 0 },
      orientation: 0
    };
    const placement: MeeplePlacement = {
      tilePosition: { x: 0, y: 0 },
      featureType: 'monastery',
      featureIndex: 0
    };

    expect(getMeepleAnchor(placement, tile)).toEqual({ xPercent: 50, yPercent: 50 });
  });

  it('positions road meeples on the average of the road edges (or optimized override)', () => {
    const tile: PlacedTile = {
      tileId: 'T_R3C5',
      position: { x: 0, y: 0 },
      orientation: 90
    };
    const placement: MeeplePlacement = {
      tilePosition: { x: 0, y: 0 },
      featureType: 'road',
      featureIndex: 0
    };

    expect(getMeepleAnchor(placement, tile)).toEqual({ xPercent: 44, yPercent: 56 });
  });

  it('prefixes big-meeple role labels with big', () => {
    expect(getMeepleRoleLabel('city', 'big')).toBe('big knight');
    expect(getMeepleRoleLabel('road', 'big')).toBe('big highwayman');
    expect(getMeepleRoleLabel('farm', 'big')).toBe('big farmer');
    expect(getMeepleRoleLabel('city', 'normal')).toBe('knight');
  });
});
