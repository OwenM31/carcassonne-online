/**
 * @description Shared turn automation flow with strategy-specific decisions.
 */
import type {
  GameState,
  Orientation,
  PlacementOption,
  PlayerId,
  SessionAiProfile
} from '@carcassonne/shared';
import { getLegalTilePlacementsForState } from '@carcassonne/shared';

import type { SessionRecord } from './sessionService';
import {
  chooseJuanMeeplePlacement,
  chooseJuanTilePlacement
} from './turnTimerAi/juanTurnStrategy';
import {
  chooseMartinMeeplePlacement,
  chooseMartinTilePlacement
} from './turnTimerAi/martinTurnStrategy';
import {
  chooseRandyMeeplePlacement,
  chooseRandyTilePlacement
} from './turnTimerAi/randyTurnStrategy';
import { chooseMeepleKindForStrategy } from './turnTimerAi/meepleKindStrategy';

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
      const timeoutAction =
        game.addons.includes('abbot') &&
        game.meeples.some(
          (meeple) => meeple.playerId === activePlayer.id && meeple.kind === 'abbot'
        )
          ? { type: 'return_abbot' as const, playerId: activePlayer.id }
          : { type: 'skip_meeple' as const, playerId: activePlayer.id };
      const skipResult = session.gameService.applyAction(timeoutAction);
      if (skipResult.type === 'error') {
        return null;
      }
      return skipResult.game;
    }

    const placement = chooseMeeplePlacementForStrategy(game, activePlayer.id, strategy);
    const hasPlacedAbbot =
      game.addons.includes('abbot') &&
      game.meeples.some(
        (meeple) => meeple.playerId === activePlayer.id && meeple.kind === 'abbot'
      );
    const result = placement
      ? session.gameService.applyAction({
          type: 'place_meeple',
          playerId: activePlayer.id,
          placement,
          kind: chooseMeepleKindForStrategy(game, activePlayer.id, placement, strategy)
        })
      : session.gameService.applyAction(
          hasPlacedAbbot
            ? { type: 'return_abbot', playerId: activePlayer.id }
            : { type: 'skip_meeple', playerId: activePlayer.id }
        );
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
  if (strategy === 'juan') {
    return chooseJuanTilePlacement(game, playerId);
  }
  return chooseRandyTilePlacement(game);
}

function chooseMeeplePlacementForStrategy(
  game: GameState,
  playerId: PlayerId,
  strategy: Exclude<AutomationStrategy, 'timeout'>
) {
  if (strategy === 'martin') {
    return chooseMartinMeeplePlacement(game, playerId);
  }
  if (strategy === 'juan') {
    return chooseJuanMeeplePlacement(game, playerId);
  }
  return chooseRandyMeeplePlacement(game);
}

function chooseTimedPlacement(game: GameState): PlacementOption | null {
  if (!game.currentTileId) {
    return null;
  }

  const allOptions = getLegalTilePlacementsForState(game, game.currentTileId);
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
