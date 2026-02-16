/**
 * @description Tests for lobby protocol message validation.
 */
import { parseServerMessageEvent } from '../src/services/lobbyProtocol';

describe('parseServerMessageEvent', () => {
  it('accepts session summaries with JUAN AI profiles', () => {
    const result = parseServerMessageEvent({
      data: JSON.stringify({
        type: 'session_list',
        sessions: [
          {
            id: 'session-1',
            status: 'lobby',
            playerCount: 1,
            players: [
              {
                name: 'JUAN',
                color: 'black',
                isAi: true,
                aiProfile: 'juan',
                aiPlayerId: 'ai-juan-1'
              }
            ],
            deckSize: 'standard',
            mode: 'standard',
            tileCount: 72,
            turnTimerSeconds: 60,
            takeoverBot: 'juan',
            addons: []
          }
        ]
      })
    } as MessageEvent);

    expect(result).toEqual({
      type: 'session_list',
      sessions: [
        {
          id: 'session-1',
          status: 'lobby',
          playerCount: 1,
          players: [
            {
              name: 'JUAN',
              color: 'black',
              isAi: true,
              aiProfile: 'juan',
              aiPlayerId: 'ai-juan-1'
            }
          ],
          deckSize: 'standard',
          mode: 'standard',
          tileCount: 72,
          turnTimerSeconds: 60,
          takeoverBot: 'juan',
          addons: []
        }
      ]
    });
  });

  it('rejects session summaries with unknown takeover profiles', () => {
    const result = parseServerMessageEvent({
      data: JSON.stringify({
        type: 'session_list',
        sessions: [
          {
            id: 'session-1',
            status: 'lobby',
            playerCount: 1,
            players: [{ name: 'Ada', color: 'black' }],
            deckSize: 'standard',
            mode: 'standard',
            tileCount: 72,
            turnTimerSeconds: 60,
            takeoverBot: 'expert',
            addons: []
          }
        ]
      })
    } as MessageEvent);

    expect(result).toBeNull();
  });

  it('accepts session summaries with player isYou markers', () => {
    const result = parseServerMessageEvent({
      data: JSON.stringify({
        type: 'session_list',
        sessions: [
          {
            id: 'session-2',
            status: 'lobby',
            playerCount: 2,
            players: [{ name: 'Ada', color: 'black', isYou: true }, { name: 'Grace', color: 'red' }],
            deckSize: 'standard',
            mode: 'standard',
            tileCount: 72,
            turnTimerSeconds: 60,
            takeoverBot: 'randy',
            addons: []
          }
        ]
      })
    } as MessageEvent);

    expect(result).toEqual({
      type: 'session_list',
      sessions: [
        {
          id: 'session-2',
          status: 'lobby',
          playerCount: 2,
          players: [{ name: 'Ada', color: 'black', isYou: true }, { name: 'Grace', color: 'red' }],
          deckSize: 'standard',
          mode: 'standard',
          tileCount: 72,
          turnTimerSeconds: 60,
          takeoverBot: 'randy',
          addons: []
        }
      ]
    });
  });
});
