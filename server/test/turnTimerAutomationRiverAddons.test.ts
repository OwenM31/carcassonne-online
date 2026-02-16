/**
 * @description Regression coverage for AI automation with River and River 2 add-ons.
 */
import { createGame, type SessionAddon, type SessionAiProfile } from '@carcassonne/shared';

import { InMemoryGameService } from '../src/services/gameService';
import { InMemoryLobbyService } from '../src/services/lobbyService';
import type { SessionRecord } from '../src/services/sessionService';
import { runAutomatedTurn } from '../src/services/turnTimerAutomation';

const AI_PROFILES: SessionAiProfile[] = ['randy', 'martin', 'juan'];
const RIVER_CASES: Array<{
  label: string;
  addons: SessionAddon[];
  startingTileId: string;
  tileDeck: string[];
}> = [
  {
    label: 'River',
    addons: ['river'],
    startingTileId: 'RV1_R1C1',
    tileDeck: ['RV1_R1C3', 'T_R1C1']
  },
  {
    label: 'River + River 2',
    addons: ['river', 'river_2'],
    startingTileId: 'RV2_R1C1',
    tileDeck: ['RV2_R1C2', 'RV1_R1C3', 'T_R1C1']
  }
];

describe('runAutomatedTurn river add-on support', () => {
  it.each(AI_PROFILES.flatMap((profile) => RIVER_CASES.map((riverCase) => [profile, riverCase] as const)))(
    'plays opening river tiles in standard mode (%s, %s)',
    (profile, riverCase) => {
      const session = buildAiSession(profile, riverCase.addons, riverCase.startingTileId, riverCase.tileDeck);
      const updated = runAutomatedTurn(session, profile);

      expect(updated).not.toBeNull();
      if (!updated) {
        return;
      }

      expect(Object.keys(updated.board.tiles)).toHaveLength(2);
      expect(updated.phase).toBe('draw_tile');
      expect(updated.turnNumber).toBe(2);
      expect(updated.eventLog.some((event) => event.type === 'place_tile')).toBe(true);
    }
  );
});

function buildAiSession(
  profile: SessionAiProfile,
  addons: SessionAddon[],
  startingTileId: string,
  tileDeck: string[]
): SessionRecord {
  const aiPlayerId = `ai-${profile}-river`;
  const game = createGame({
    gameId: `game-ai-${profile}-river`,
    mode: 'standard',
    addons,
    players: [{ id: aiPlayerId, name: profile.toUpperCase(), color: 'yellow' }],
    tileDeck,
    startingTileId,
    turnTimerSeconds: 0
  });
  const gameService = new InMemoryGameService(() => `game-ai-${profile}-river`, {
    game,
    history: [],
    startConfig: {
      deckSize: 'standard',
      mode: 'standard',
      addons,
      turnTimerSeconds: 0
    }
  });

  const lobbyService = new InMemoryLobbyService();
  lobbyService.join(aiPlayerId, profile.toUpperCase());

  return {
    id: `session-ai-${profile}-river`,
    deckSize: 'standard',
    mode: 'standard',
    addons,
    turnTimerSeconds: 0,
    takeoverBot: 'randy',
    aiPlayerIds: new Set([aiPlayerId]),
    lobbyService,
    gameService
  };
}
