/**
 * @description Shared turn automation flow with strategy-specific decisions.
 */
import type {
  BoardState,
  GameState,
  Orientation,
  PlacementOption,
  PlayerId,
  SessionAiProfile
} from '@carcassonne/shared';
import { getLegalTilePlacements } from '@carcassonne/shared';

import type { SessionRecord } from './sessionService';
import {
  chooseMartinMeeplePlacement,
  chooseMartinTilePlacement
} from './turnTimerAi/martinTurnStrategy';
import {
  chooseRandyMeeplePlacement,
  chooseRandyTilePlacement
} from './turnTimerAi/randyTurnStrategy';

export type AutomationStrategy = 'timeout' | SessionAiProfile;

export function runAutomatedTurn(
  session: SessionRecord,
  strategy: AutomationStrategy
): GameState | null {
  let game = session.gameService.getGame();
  if (!game || game.status !== 'active') {
    return null;
  }

  let activePlayer = game.players[game.activePlayerIndex];
  if (!activePlayer) {
    return null;
  }

  if (game.phase === 'draw_tile') {
    const drawResult = session.gameService.applyAction({
      type: 'draw_tile',
      playerId: activePlayer.id
    });
    if (drawResult.type === 'error') {
      return null;
    }

    game = drawResult.game;
    activePlayer = game.players[game.activePlayerIndex];
    if (!activePlayer) {
      return null;
    }
  }

  if (game.phase === 'place_tile') {
    const placement = choosePlacementForStrategy(game, activePlayer.id, strategy);
    if (!placement || !game.currentTileId) {
      return null;
    }

    const placeResult = session.gameService.applyAction({
      type: 'place_tile',
      playerId: activePlayer.id,
      tileId: game.currentTileId,
      position: placement.position,
      orientation: placement.orientation
    });
    if (placeResult.type === 'error') {
      return null;
    }

    game = placeResult.game;
    activePlayer = game.players[game.activePlayerIndex];
    if (!activePlayer) {
      return null;
    }
  }

  if (game.phase === 'place_meeple') {
    if (strategy === 'timeout') {
      const skipResult = session.gameService.applyAction({
        type: 'skip_meeple',
        playerId: activePlayer.id
      });
      if (skipResult.type === 'error') {
        return null;
      }
      return skipResult.game;
    }

    const placement =
      strategy === 'martin'
        ? chooseMartinMeeplePlacement(game, activePlayer.id)
        : chooseRandyMeeplePlacement(game);
    const result = placement
      ? session.gameService.applyAction({
          type: 'place_meeple',
          playerId: activePlayer.id,
          placement
        })
      : session.gameService.applyAction({
          type: 'skip_meeple',
          playerId: activePlayer.id
        });
    if (result.type === 'error') {
      return null;
    }

    return result.game;
  }

  return game;
}

function choosePlacementForStrategy(
  game: GameState,
  playerId: PlayerId,
  strategy: AutomationStrategy
): PlacementOption | null {
  if (strategy === 'timeout') {
    return chooseTimedPlacement(game);
  }
  if (strategy === 'martin') {
    return chooseMartinTilePlacement(game, playerId);
  }
  return chooseRandyTilePlacement(game);
}

function chooseTimedPlacement(game: {
  board: BoardState;
  currentTileId: string | null;
  currentTileOrientation: Orientation | null;
}): PlacementOption | null {
  if (!game.currentTileId) {
    return null;
  }

  const allOptions = getLegalTilePlacements(game.board, game.currentTileId);
  if (allOptions.length === 0) {
    return null;
  }

  const preferred = game.currentTileOrientation ?? randomOrientation();
  const optionsByPreferred = allOptions.filter((option) => option.orientation === preferred);
  if (optionsByPreferred.length > 0) {
    return pickRandom(optionsByPreferred);
  }

  const rotations = shuffleOrientations([0, 90, 180, 270]);
  for (const rotation of rotations) {
    const options = allOptions.filter((option) => option.orientation === rotation);
    if (options.length > 0) {
      return pickRandom(options);
    }
  }

  return pickRandom(allOptions);
}

function shuffleOrientations(orientations: Orientation[]): Orientation[] {
  const values = [...orientations];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function randomOrientation(): Orientation {
  return pickRandom([0, 90, 180, 270]);
}

function pickRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}
