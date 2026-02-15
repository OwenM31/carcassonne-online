/**
 * @description Helpers for grouping game events by completed turn.
 */
import type { GameEvent } from '@carcassonne/shared';

export interface EventTurnGroup {
  turn: number;
  events: GameEvent[];
}

export function groupEventsByTurn(eventLog: GameEvent[]): EventTurnGroup[] {
  const groupsByTurn = new Map<number, GameEvent[]>();

  for (const entry of eventLog) {
    const grouped = groupsByTurn.get(entry.turn);
    if (grouped) {
      grouped.push(entry);
      continue;
    }

    groupsByTurn.set(entry.turn, [entry]);
  }

  return [...groupsByTurn.entries()]
    .sort((left, right) => right[0] - left[0])
    .map(([turn, events]) => ({ turn, events }));
}
