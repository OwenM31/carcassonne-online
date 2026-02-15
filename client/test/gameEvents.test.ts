/**
 * @description Unit tests for grouping game events by turn.
 */
import type { GameEvent } from '@carcassonne/shared';

import { groupEventsByTurn } from '../src/state/gameEvents';

describe('groupEventsByTurn', () => {
  it('groups events by turn and orders groups from newest to oldest', () => {
    const events: GameEvent[] = [
      { turn: 1, type: 'draw_tile', detail: 'Turn 1 draw' },
      { turn: 1, type: 'place_tile', detail: 'Turn 1 place' },
      { turn: 2, type: 'draw_tile', detail: 'Turn 2 draw' },
      { turn: 2, type: 'score', detail: 'Turn 2 score' },
      { turn: 3, type: 'draw_tile', detail: 'Turn 3 draw' }
    ];

    const groups = groupEventsByTurn(events);

    expect(groups.map((group) => group.turn)).toEqual([3, 2, 1]);
    expect(groups[1]?.events.map((entry) => entry.detail)).toEqual(['Turn 2 draw', 'Turn 2 score']);
  });
});
