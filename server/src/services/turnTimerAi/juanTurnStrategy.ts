/**
 * @description JUAN heuristics for slightly stronger score-aware tile and meeple decisions.
 */
import type {
  FeatureType,
  GameState,
  MeeplePlacement,
  PlacementOption,
  PlayerId
} from '@carcassonne/shared';
import {
  applyGameAction,
  getLegalMeeplePlacements,
  getLegalTilePlacementsForState
} from '@carcassonne/shared';
import {
  buildTieSeed,
  countAdjacentTiles,
  type RankedCandidate,
  meeplePlacementKey,
  pickBestCandidate,
  pickRandom
} from './martinHeuristicUtils';
import { chooseMeepleKindForStrategy } from './meepleKindStrategy';

const FEATURE_PLACEMENT_BONUS: Record<FeatureType, number> = {
  city: 14,
  road: 9,
  farm: 4,
  monastery: 12,
  garden: 12
};

export function chooseJuanTilePlacement(
  game: GameState,
  playerId: PlayerId
): PlacementOption | null {
  const candidates = evaluatePlacementCandidates(game, playerId);
  if (candidates.length === 0) {
    if (!game.currentTileId) {
      return null;
    }

    const options = getLegalTilePlacementsForState(game, game.currentTileId);
    return options.length > 0 ? pickRandom(options) : null;
  }

  const tieSeed = buildTieSeed(game, playerId, 'place');
  const best = pickBestCandidate(candidates, tieSeed);
  return best?.value ?? null;
}

export function chooseJuanMeeplePlacement(
  game: GameState,
  playerId: PlayerId
): MeeplePlacement | null {
  const choice = evaluateJuanMeepleChoice(game, playerId);
  return choice?.value ?? null;
}

function evaluatePlacementCandidates(
  game: GameState,
  playerId: PlayerId
): RankedCandidate<PlacementOption>[] {
  if (!game.currentTileId) {
    return [];
  }

  const allOptions = getLegalTilePlacementsForState(game, game.currentTileId);
  const ranked: RankedCandidate<PlacementOption>[] = [];
  allOptions.forEach((option) => {
    const placeResult = applyGameAction(game, {
      type: 'place_tile',
      playerId,
      tileId: game.currentTileId ?? '',
      position: option.position,
      orientation: option.orientation
    });
    if (placeResult.type === 'error') {
      return;
    }

    const afterPlacement = placeResult.game;
    const meepleDecision = evaluateJuanMeepleChoice(afterPlacement, playerId);
    if (!meepleDecision) {
      return;
    }

    const legalMeeplePlacements = getLegalMeeplePlacements(afterPlacement);
    const cityOptions = legalMeeplePlacements.filter((placement) => placement.featureType === 'city').length;
    const monasteryOptions = legalMeeplePlacements.filter(
      (placement) =>
        placement.featureType === 'monastery' || placement.featureType === 'garden'
    ).length;
    const projectedScore = meepleDecision.score + (meepleDecision.scoreDelta ?? 0) * 25;
    const adjacencyScore = countAdjacentTiles(game.board, option.position) * 4;
    ranked.push({
      value: option,
      key: `${option.position.x},${option.position.y},${option.orientation}`,
      score:
        projectedScore +
        adjacencyScore +
        legalMeeplePlacements.length * 2 +
        cityOptions * 2 +
        monasteryOptions * 2
    });
  });

  return ranked;
}

function evaluateJuanMeepleChoice(
  game: GameState,
  playerId: PlayerId
): RankedCandidate<MeeplePlacement | null> | null {
  const playerBefore = game.players.find((player) => player.id === playerId);
  if (!playerBefore) {
    return null;
  }

  const legalPlacements = getLegalMeeplePlacements(game);
  const ranked: RankedCandidate<MeeplePlacement | null>[] = legalPlacements
    .map((placement) => buildMeepleCandidate(game, playerId, placement, playerBefore.score))
    .filter((candidate): candidate is RankedCandidate<MeeplePlacement> => candidate !== null);
  const hasStrongPlacement = ranked.some((candidate) => (candidate.scoreDelta ?? 0) >= 2);
  const skipCandidate = buildSkipCandidate(game, playerId, playerBefore.score, legalPlacements.length, hasStrongPlacement);
  if (skipCandidate) {
    ranked.push(skipCandidate);
  }

  if (ranked.length === 0) {
    return null;
  }

  return pickBestCandidate(ranked, buildTieSeed(game, playerId, 'meeple'));
}

function buildMeepleCandidate(
  game: GameState,
  playerId: PlayerId,
  placement: MeeplePlacement,
  scoreBefore: number
): RankedCandidate<MeeplePlacement> | null {
  const kind = chooseMeepleKindForStrategy(game, playerId, placement, 'juan');
  const result = applyGameAction(game, { type: 'place_meeple', playerId, placement, kind });
  if (result.type === 'error') {
    return null;
  }

  const playerAfter = result.game.players.find((player) => player.id === playerId);
  if (!playerAfter) {
    return null;
  }

  const scoreDelta = playerAfter.score - scoreBefore;
  let score = scoreDelta * 125 + 8 + FEATURE_PLACEMENT_BONUS[placement.featureType];
  if (playerAfter.meeplesAvailable <= 2 && scoreDelta < 2) {
    score -= 35;
  }
  if (playerAfter.meeplesAvailable <= 1 && scoreDelta < 3) {
    score -= 20;
  }

  return {
    value: placement,
    key: meeplePlacementKey(placement),
    score,
    scoreDelta
  };
}

function buildSkipCandidate(
  game: GameState,
  playerId: PlayerId,
  scoreBefore: number,
  legalPlacementCount: number,
  hasStrongPlacement: boolean
): RankedCandidate<null> | null {
  const result = applyGameAction(game, { type: 'skip_meeple', playerId });
  if (result.type === 'error') {
    return null;
  }

  const playerAfter = result.game.players.find((player) => player.id === playerId);
  if (!playerAfter) {
    return null;
  }

  const scoreDelta = playerAfter.score - scoreBefore;
  let score = scoreDelta * 125;
  if (legalPlacementCount > 0) {
    score -= hasStrongPlacement ? 12 : 4;
  }

  return {
    value: null,
    key: 'none',
    score,
    scoreDelta
  };
}
