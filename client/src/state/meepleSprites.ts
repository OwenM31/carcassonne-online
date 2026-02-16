/**
 * @description Provides pre-exported transparent sprite URLs for meeple pieces.
 */
import type { PlayerColor } from '@carcassonne/shared';

export type MeepleSpriteByColor = Partial<Record<PlayerColor, string>>;
export type MeepleSpriteVariant = 'normal' | 'big' | 'builder' | 'pig' | 'abbot';

const MEEPLE_SPRITES_BY_VARIANT: Record<MeepleSpriteVariant, MeepleSpriteByColor> = {
  normal: {
    black: '/meeples/black.png?v=1',
    red: '/meeples/red.png?v=1',
    yellow: '/meeples/yellow.png?v=1',
    green: '/meeples/green.png?v=1',
    blue: '/meeples/blue.png?v=1',
    gray: '/meeples/gray.png?v=1',
    pink: '/meeples/pink.png?v=1'
  },
  big: {
    black: '/meeples/big-black.png?v=1',
    red: '/meeples/big-red.png?v=1',
    yellow: '/meeples/big-yellow.png?v=1',
    green: '/meeples/big-green.png?v=1',
    blue: '/meeples/big-blue.png?v=1',
    gray: '/meeples/big-gray.png?v=1',
    pink: '/meeples/big-pink.png?v=1'
  },
  builder: {
    black: '/meeples/builder-black.png?v=1',
    red: '/meeples/builder-red.png?v=1',
    yellow: '/meeples/builder-yellow.png?v=1',
    green: '/meeples/builder-green.png?v=1',
    blue: '/meeples/builder-blue.png?v=1',
    gray: '/meeples/builder-gray.png?v=1',
    pink: '/meeples/builder-pink.png?v=1'
  },
  pig: {
    black: '/meeples/pig-black.png?v=1',
    red: '/meeples/pig-red.png?v=1',
    yellow: '/meeples/pig-yellow.png?v=1',
    green: '/meeples/pig-green.png?v=1',
    blue: '/meeples/pig-blue.png?v=1',
    gray: '/meeples/pig-gray.png?v=1',
    pink: '/meeples/pig-pink.png?v=1'
  },
  abbot: {
    black: '/meeples/abbot-black.png?v=1',
    red: '/meeples/abbot-red.png?v=1',
    yellow: '/meeples/abbot-yellow.png?v=1',
    green: '/meeples/abbot-green.png?v=1',
    blue: '/meeples/abbot-blue.png?v=1',
    gray: '/meeples/abbot-gray.png?v=1',
    pink: '/meeples/abbot-pink.png?v=1'
  }
};

export function getMeepleSprites(variant: MeepleSpriteVariant = 'normal'): MeepleSpriteByColor {
  return MEEPLE_SPRITES_BY_VARIANT[variant];
}

export function loadMeepleSprites(
  variant: MeepleSpriteVariant = 'normal'
): Promise<MeepleSpriteByColor> {
  return Promise.resolve(getMeepleSprites(variant));
}
