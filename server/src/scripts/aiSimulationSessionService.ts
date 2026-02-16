/**
 * @description SessionService adapter for simulation sessions.
 */
import { buildTileDeck, type SessionSummary } from '@carcassonne/shared';

import type { SessionRecord, SessionService } from '../services/sessionService';
import { inferProfileFromPlayerId } from './aiSimulationProfiles';

export function buildSimulationSessionService(session: SessionRecord): SessionService {
  const buildSummary = (): SessionSummary => {
    const game = session.gameService.getGame();
    const tileCount = game
      ? game.tileDeck.length + (game.currentTileId ? 1 : 0)
      : buildTileDeck(undefined, session.deckSize, session.addons).length;

    return {
    id: session.id,
    status: game ? 'in_progress' : 'lobby',
    playerCount: session.lobbyService.getState().players.length,
    players: session.lobbyService.getState().players.map((player) => ({
      name: player.name,
      color: player.color ?? 'black',
      isAi: true,
      aiProfile: inferProfileFromPlayerId(player.id),
      aiPlayerId: player.id
    })),
    deckSize: session.deckSize,
    mode: session.mode,
    addons: session.addons,
    tileCount,
    turnTimerSeconds: session.turnTimerSeconds,
    takeoverBot: session.takeoverBot
    };
  };

  return {
    createSession: (_deckSize, _mode, _turnTimerSeconds, _addons) => session,
    updateSessionDeckSize: () => ({ type: 'success', session }),
    updateSessionMode: () => ({ type: 'success', session }),
    updateSessionAddons: () => ({ type: 'success', session }),
    updateSessionTurnTimer: () => ({ type: 'success', session }),
    updateSessionPlayerColor: () => ({ type: 'success', session }),
    updateSessionTakeoverBot: () => ({ type: 'success', session }),
    addAiPlayer: () => ({ type: 'success', session }),
    removeAiPlayer: () => ({ type: 'success', session }),
    isAiPlayer: (_sessionId, playerId) => session.aiPlayerIds.has(playerId),
    getSession: (sessionId) => (sessionId === session.id ? session : null),
    listSessions: () => [buildSummary()],
    deleteSession: () => false,
    persist: () => {}
  };
}
