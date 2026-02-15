/**
 * @description Read-only turn replay state derived from live game updates.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '@carcassonne/shared';

type CompletedTurnSnapshots = Record<number, GameState>;

export interface GameReplayState {
  viewGame: GameState;
  replayTurn: number | null;
  isCurrentView: boolean;
  canStepBackward: boolean;
  canStepForward: boolean;
  canJumpCurrent: boolean;
  jumpToCurrent: () => void;
  stepBackward: () => void;
  stepForward: () => void;
  jumpToTurnCompletion: (turn: number) => void;
}

export function getCompletedTurnFromState(game: GameState): number | null {
  if (
    game.status === 'active' &&
    game.phase === 'draw_tile' &&
    game.currentTileId === null &&
    game.turnNumber > 1
  ) {
    return game.turnNumber - 1;
  }

  if (game.phase === 'game_over') {
    return game.turnNumber;
  }

  return null;
}

export function getSortedCompletedTurns(snapshots: CompletedTurnSnapshots): number[] {
  return Object.keys(snapshots)
    .map((turn) => Number(turn))
    .filter((turn) => Number.isInteger(turn) && turn > 0)
    .sort((left, right) => left - right);
}

function getPreviousTurn(turns: number[], currentTurn: number | null): number | null {
  if (turns.length === 0) {
    return null;
  }

  if (currentTurn === null) {
    return turns[turns.length - 1] ?? null;
  }

  for (let index = turns.length - 1; index >= 0; index -= 1) {
    if (turns[index] < currentTurn) {
      return turns[index];
    }
  }

  return currentTurn;
}

function getNextTurn(turns: number[], currentTurn: number | null): number | null {
  if (currentTurn === null) {
    return null;
  }

  for (const turn of turns) {
    if (turn > currentTurn) {
      return turn;
    }
  }

  return null;
}

export function useGameReplay(game: GameState): GameReplayState {
  const [snapshots, setSnapshots] = useState<CompletedTurnSnapshots>({});
  const [replayTurn, setReplayTurn] = useState<number | null>(null);
  const gameIdRef = useRef(game.id);

  useEffect(() => {
    if (gameIdRef.current !== game.id) {
      gameIdRef.current = game.id;
      setSnapshots({});
      setReplayTurn(null);
      return;
    }

    const completedTurn = getCompletedTurnFromState(game);
    if (completedTurn === null) {
      return;
    }

    setSnapshots((current) => ({ ...current, [completedTurn]: game }));
  }, [game]);

  useEffect(() => {
    if (replayTurn !== null && !snapshots[replayTurn]) {
      setReplayTurn(null);
    }
  }, [replayTurn, snapshots]);

  const completedTurns = useMemo(() => getSortedCompletedTurns(snapshots), [snapshots]);
  const viewGame = replayTurn === null ? game : snapshots[replayTurn] ?? game;
  const previousTurn = getPreviousTurn(completedTurns, replayTurn);
  const nextTurn = getNextTurn(completedTurns, replayTurn);

  return {
    viewGame,
    replayTurn,
    isCurrentView: replayTurn === null,
    canStepBackward: previousTurn !== null && previousTurn !== replayTurn,
    canStepForward: replayTurn !== null,
    canJumpCurrent: replayTurn !== null,
    jumpToCurrent: () => setReplayTurn(null),
    stepBackward: () => {
      if (previousTurn !== null && previousTurn !== replayTurn) {
        setReplayTurn(previousTurn);
      }
    },
    stepForward: () => {
      if (replayTurn === null) {
        return;
      }

      setReplayTurn(nextTurn);
    },
    jumpToTurnCompletion: (turn: number) => setReplayTurn(snapshots[turn] ? turn : null)
  };
}
