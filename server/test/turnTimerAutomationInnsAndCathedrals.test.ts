/**
 * @description Regression coverage for AI automation with Inns and Cathedrals big meeple support.
 */
import {
  createGame,
  getStartingTileCandidates,
  type SessionAddon,
  type SessionAiProfile
} from '@carcassonne/shared';

import { InMemoryGameService } from '../src/services/gameService';
import { InMemoryLobbyService } from '../src/services/lobbyService';
import type { SessionRecord } from '../src/services/sessionService';
import { runAutomatedTurn } from '../src/services/turnTimerAutomation';

const INNS_AND_CATHEDRALS: SessionAddon = 'inns_and_cathedrals';
const AI_PROFILES: SessionAiProfile[] = ['randy', 'martin', 'juan'];

describe('runAutomatedTurn Inns and Cathedrals support', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(AI_PROFILES)(
    'uses big meeple when normal meeples are exhausted (%s)',
    (profile) => {
      if (profile === 'randy') {
        jest.spyOn(Math, 'random').mockReturnValue(0.99);
      }

      const session = buildAiSession(profile);
      const updated = runAutomatedTurn(session, profile);

      expect(updated).not.toBeNull();
      if (!updated) {
        return;
      }

      const activePlayer = updated.players.find((player) => player.id === `ai-${profile}-1`);
      expect(activePlayer?.meeplesAvailable).toBe(0);
      expect(activePlayer?.bigMeepleAvailable).toBe(false);
      expect(updated.meeples.some((meeple) => meeple.kind === 'big')).toBe(true);
      expect(
        updated.eventLog.some(
          (event) => event.type === 'place_meeple' && event.detail.includes('big meeple')
        )
      ).toBe(true);
    }
  );
});

function buildAiSession(profile: SessionAiProfile): SessionRecord {
  const addons: SessionAddon[] = [INNS_AND_CATHEDRALS];
  const startingTileId = getStartingTileCandidates(undefined, addons)[0];
  if (!startingTileId) {
    throw new Error('Expected a configured starting tile for Inns and Cathedrals.');
  }

  const aiPlayerId = `ai-${profile}-1`;
  const game = createGame({
    gameId: `game-ai-${profile}`,
    mode: 'sandbox',
    addons,
    players: [
      {
        id: aiPlayerId,
        name: profile.toUpperCase(),
        color: 'yellow',
        meeplesAvailable: 0,
        bigMeepleAvailable: true
      }
    ],
    tileDeck: ['T_R1C1'],
    startingTileId,
    turnTimerSeconds: 0
  });
  const gameService = new InMemoryGameService(() => `game-ai-${profile}`, {
    game,
    history: [],
    redoStack: [],
    startConfig: {
      deckSize: 'standard',
      mode: 'sandbox',
      addons,
      turnTimerSeconds: 0
    }
  });

  const lobbyService = new InMemoryLobbyService();
  lobbyService.join(aiPlayerId, profile.toUpperCase());

  return {
    id: `session-ai-${profile}`,
    deckSize: 'standard',
    mode: 'sandbox',
    addons,
    turnTimerSeconds: 0,
    takeoverBot: 'randy',
    aiPlayerIds: new Set([aiPlayerId]),
    lobbyService,
    gameService
  };
}
