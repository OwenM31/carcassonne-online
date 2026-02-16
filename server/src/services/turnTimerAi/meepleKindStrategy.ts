/**
 * @description Strategy-specific selection for normal vs big meeple placement.
 */
import type {
  FeatureType,
  GameState,
  MeepleKind,
  MeeplePlacement,
  PlayerId
} from '@carcassonne/shared';

export type MeepleKindStrategy = 'randy' | 'martin' | 'juan';

export function chooseMeepleKindForStrategy(
  game: GameState,
  playerId: PlayerId,
  placement: MeeplePlacement,
  strategy: MeepleKindStrategy
): MeepleKind {
  const player = game.players.find((entry) => entry.id === playerId);
  if (!player) {
    return 'normal';
  }

  if (placement.featureType === 'garden') {
    return game.addons.includes('abbot') && player.abbotAvailable ? 'abbot' : 'normal';
  }

  if (
    game.addons.includes('abbot') &&
    player.abbotAvailable &&
    shouldUseAbbot(strategy, placement.featureType, player.meeplesAvailable)
  ) {
    return 'abbot';
  }

  if (!player.bigMeepleAvailable) {
    return 'normal';
  }
  if (player.meeplesAvailable <= 0) {
    return 'big';
  }

  if (strategy === 'randy') {
    return shouldRandyUseBigMeeple(placement.featureType) ? 'big' : 'normal';
  }
  if (strategy === 'martin') {
    return shouldMartinUseBigMeeple(player.meeplesAvailable, placement.featureType)
      ? 'big'
      : 'normal';
  }

  return shouldJuanUseBigMeeple(player.meeplesAvailable, placement.featureType)
    ? 'big'
    : 'normal';
}

function shouldUseAbbot(
  strategy: MeepleKindStrategy,
  featureType: FeatureType,
  meeplesAvailable: number
): boolean {
  if (featureType !== 'monastery') {
    return false;
  }

  if (strategy === 'randy') {
    return Math.random() < 0.45;
  }
  if (strategy === 'martin') {
    return meeplesAvailable <= 4;
  }

  return true;
}

function shouldRandyUseBigMeeple(featureType: FeatureType): boolean {
  if (featureType === 'city') {
    return Math.random() < 0.35;
  }
  if (featureType === 'monastery') {
    return Math.random() < 0.2;
  }

  return false;
}

function shouldMartinUseBigMeeple(
  meeplesAvailable: number,
  featureType: FeatureType
): boolean {
  if (featureType === 'city' || featureType === 'monastery') {
    return meeplesAvailable <= 3;
  }

  if (featureType === 'road') {
    return meeplesAvailable <= 1;
  }

  return false;
}

function shouldJuanUseBigMeeple(
  meeplesAvailable: number,
  featureType: FeatureType
): boolean {
  if (featureType === 'city' || featureType === 'monastery') {
    return true;
  }

  if (featureType === 'road') {
    return meeplesAvailable <= 2;
  }

  return false;
}
