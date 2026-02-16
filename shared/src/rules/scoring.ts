/**
 * @description Scoring resolution for completed features and final game scoring.
 */
import type { GameEvent, GameState, PlacedMeeple, PlayerState } from '../types/game';
import { analyzeBoardFeatures, type FeatureComponent } from './featureAnalysis';
import { toFeatureKey } from './featureKeys';

export interface ScoringResolution {
  players: PlayerState[];
  meeples: PlacedMeeple[];
  events: GameEvent[];
}

export function resolveCompletedFeatureScoring(state: GameState): ScoringResolution {
  return resolveScoring(state, false);
}

export function resolveFinalScoring(state: GameState): ScoringResolution {
  return resolveScoring(state, true);
}

function resolveScoring(state: GameState, isFinal: boolean): ScoringResolution {
  const analysis = analyzeBoardFeatures(state.board);
  const completedCityIds = new Set(
    analysis.components
      .filter((component) => component.type === 'city' && component.openEnds === 0)
      .map((component) => component.id)
  );
  const components = analysis.components.filter((component) =>
    isFinal
      ? true
      : (component.type === 'city' ||
          component.type === 'road' ||
          component.type === 'monastery' ||
          component.type === 'garden') &&
        component.openEnds === 0
  );
  const meeplesByComponent = indexMeeplesByComponent(state, analysis.componentByFeatureKey);
  const awardedScores: Record<string, number> = {};
  const returnedNormalMeeples: Record<string, number> = {};
  const returnedBigMeeples: Record<string, true> = {};
  const returnedAbbots: Record<string, true> = {};
  const removeMeeplesFromComponents = new Set<string>();
  const events: GameEvent[] = [];
  const playerNames = indexPlayerNames(state.players);

  components.forEach((component) => {
    const meeples = meeplesByComponent.get(component.id) ?? [];
    if (meeples.length === 0) {
      return;
    }

    const points = scoreComponent(component, completedCityIds, isFinal);
    const majorityPlayerIds = getMajorityPlayers(meeples);
    majorityPlayerIds.forEach((playerId) => {
      awardedScores[playerId] = (awardedScores[playerId] ?? 0) + points;
    });

    if (!isFinal) {
      removeMeeplesFromComponents.add(component.id);
      meeples.forEach((meeple) => {
        if (meeple.kind === 'big') {
          returnedBigMeeples[meeple.playerId] = true;
          return;
        }
        if (meeple.kind === 'abbot') {
          returnedAbbots[meeple.playerId] = true;
          return;
        }
        returnedNormalMeeples[meeple.playerId] = (returnedNormalMeeples[meeple.playerId] ?? 0) + 1;
      });
    }

    if (points > 0) {
      events.push({
        turn: state.turnNumber,
        type: 'score',
        detail: `${formatPlayers(majorityPlayerIds, playerNames)} scored ${points} for ${formatFeatureLabel(component.type)}.`,
        playerId: majorityPlayerIds[0]
      });
    }
  });

  const players = state.players.map((player) => ({
    ...player,
    score: player.score + (awardedScores[player.id] ?? 0),
    meeplesAvailable: player.meeplesAvailable + (returnedNormalMeeples[player.id] ?? 0),
    bigMeepleAvailable: player.bigMeepleAvailable || !!returnedBigMeeples[player.id],
    abbotAvailable: player.abbotAvailable || !!returnedAbbots[player.id]
  }));
  const meeples = state.meeples.filter((meeple) => {
    const featureKey = toFeatureKey(
      meeple.tilePosition,
      meeple.featureType,
      meeple.featureIndex
    );
    const componentId = analysis.componentByFeatureKey[featureKey];
    return !componentId || !removeMeeplesFromComponents.has(componentId);
  });

  return { players, meeples, events };
}

function scoreComponent(
  component: FeatureComponent,
  completedCityIds: Set<string>,
  isFinal: boolean
): number {
  if (!isFinal) {
    if (component.type === 'city') {
      const unit = component.hasCathedral ? 3 : 2;
      return component.tileKeys.length * unit + component.pennants * unit;
    }
    if (component.type === 'road') {
      return component.tileKeys.length * (component.hasInn ? 2 : 1);
    }
    if (component.type === 'monastery' || component.type === 'garden') {
      return 9;
    }
    return 0;
  }

  if (component.type === 'city') {
    if (component.hasCathedral && component.openEnds > 0) {
      return 0;
    }
    const unit = component.hasCathedral ? 3 : 1;
    return component.tileKeys.length * unit + component.pennants * unit;
  }
  if (component.type === 'road') {
    if (component.hasInn && component.openEnds > 0) {
      return 0;
    }
    return component.tileKeys.length * (component.hasInn ? 2 : 1);
  }
  if (component.type === 'monastery' || component.type === 'garden') {
    return 9 - component.openEnds;
  }

  const completedAdjacent = component.adjacentCityComponentIds.filter((cityId) =>
    completedCityIds.has(cityId)
  ).length;
  return completedAdjacent * 3;
}

function getMajorityPlayers(meeples: PlacedMeeple[]): string[] {
  const counts: Record<string, number> = {};
  meeples.forEach((meeple) => {
    const strength = meeple.kind === 'big' ? 2 : 1;
    counts[meeple.playerId] = (counts[meeple.playerId] ?? 0) + strength;
  });

  const highest = Math.max(...Object.values(counts));
  return Object.entries(counts)
    .filter(([, count]) => count === highest)
    .map(([playerId]) => playerId);
}

function indexMeeplesByComponent(
  state: GameState,
  componentByFeatureKey: Record<string, string>
): Map<string, PlacedMeeple[]> {
  const index = new Map<string, PlacedMeeple[]>();

  state.meeples.forEach((meeple) => {
    const featureKey = toFeatureKey(
      meeple.tilePosition,
      meeple.featureType,
      meeple.featureIndex
    );
    const componentId = componentByFeatureKey[featureKey];
    if (!componentId) {
      return;
    }

    const current = index.get(componentId) ?? [];
    current.push(meeple);
    index.set(componentId, current);
  });

  return index;
}

function indexPlayerNames(players: PlayerState[]): Record<string, string> {
  return players.reduce<Record<string, string>>((index, player) => {
    index[player.id] = player.name;
    return index;
  }, {});
}

function formatPlayers(playerIds: string[], namesById: Record<string, string>): string {
  return playerIds.map((playerId) => namesById[playerId] ?? playerId).join(', ');
}

function formatFeatureLabel(featureType: FeatureComponent['type']): string {
  if (featureType === 'farm') {
    return 'grassland';
  }

  return featureType;
}
