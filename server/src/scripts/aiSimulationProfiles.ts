/**
 * @description Shared profile helpers for AI simulation scripts.
 */
import type { SessionAiProfile } from '@carcassonne/shared';

export interface SimulationProfilePair {
  first: SessionAiProfile;
  second: SessionAiProfile;
}

const DEFAULT_PROFILE_PAIR: SimulationProfilePair = {
  first: 'randy',
  second: 'martin'
};

export function resolveSimulationProfilePair(input: {
  firstProfile?: SessionAiProfile;
  secondProfile?: SessionAiProfile;
}): SimulationProfilePair {
  const first = input.firstProfile ?? DEFAULT_PROFILE_PAIR.first;
  const second = input.secondProfile ?? DEFAULT_PROFILE_PAIR.second;
  if (first === second) {
    throw new Error('Simulation profiles must be different.');
  }

  return { first, second };
}

export function createProfileScoreMap(): Record<SessionAiProfile, number> {
  return { randy: 0, martin: 0, juan: 0 };
}

export function inferProfileFromPlayerId(playerId: string): SessionAiProfile {
  if (playerId.includes('ai-martin-')) {
    return 'martin';
  }
  if (playerId.includes('ai-juan-')) {
    return 'juan';
  }
  return 'randy';
}

export function formatAiProfileName(profile: SessionAiProfile): string {
  return profile.toUpperCase();
}
