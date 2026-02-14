/**
 * @description Unit tests for meeple anchor positioning on tiles.
 */
import type { MeeplePlacement, PlacedTile } from '@carcassonne/shared';

import { getMeepleAnchor } from '../src/state/meepleLayout';

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

  it('positions road meeples on the average of the road edges', () => {
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

    expect(getMeepleAnchor(placement, tile)).toEqual({ xPercent: 50, yPercent: 50 });
  });
});
