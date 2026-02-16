/**
 * @description MARTIN heuristics for score-aware tile and meeple decisions.
 */
import type {
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

export function chooseMartinTilePlacement(
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

export function chooseMartinMeeplePlacement(
  game: GameState,
  playerId: PlayerId
): MeeplePlacement | null {
  const choice = evaluateMartinMeepleChoice(game, playerId);
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
    const meepleDecision = evaluateMartinMeepleChoice(afterPlacement, playerId);
    if (!meepleDecision) {
      return;
    }

    const meepleOptionCount = getLegalMeeplePlacements(afterPlacement).length;
    const adjacencyScore = countAdjacentTiles(game.board, option.position) * 3;
    const projectedScore = meepleDecision.score + (meepleDecision.scoreDelta ?? 0) * 20;
    ranked.push({
      value: option,
      key: `${option.position.x},${option.position.y},${option.orientation}`,
      score: projectedScore + adjacencyScore + meepleOptionCount * 2
    });
  });

  return ranked;
}

function evaluateMartinMeepleChoice(
  game: GameState,
  playerId: PlayerId
): RankedCandidate<MeeplePlacement | null> | null {
  const playerBefore = game.players.find((player) => player.id === playerId);
  if (!playerBefore) {
    return null;
  }

  const legalPlacements = getLegalMeeplePlacements(game);
  const ranked: RankedCandidate<MeeplePlacement | null>[] = [];
  const options = [null, ...legalPlacements];
  options.forEach((option) => {
    const result = applyGameAction(
      game,
      option
        ? {
            type: 'place_meeple',
            playerId,
            placement: option,
            kind: chooseMeepleKindForStrategy(game, playerId, option, 'martin')
          }
        : { type: 'skip_meeple', playerId }
    );
    if (result.type === 'error') {
      return;
    }

    const playerAfter = result.game.players.find((player) => player.id === playerId);
    if (!playerAfter) {
      return;
    }

    const scoreDelta = playerAfter.score - playerBefore.score;
    const usesMeeple = option !== null;
    let score = scoreDelta * 100;
    if (usesMeeple) {
      score += 10;
      if (scoreDelta >= 3) {
        score += 15;
      }
      if (playerAfter.meeplesAvailable <= 2 && scoreDelta < 2) {
        score -= 25;
      }
    } else if (legalPlacements.length > 0) {
      score -= 5;
    }

    ranked.push({
      value: option,
      key: option ? meeplePlacementKey(option) : 'none',
      score,
      scoreDelta
    });
  });

  if (ranked.length === 0) {
    return null;
  }

  return pickBestCandidate(ranked, buildTieSeed(game, playerId, 'meeple'));
}
