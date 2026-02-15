/**
 * @description RANDY heuristics for automated tile and meeple decisions.
 */
import type {
  BoardState,
  GameState,
  MeeplePlacement,
  Orientation,
  PlacementOption
} from '@carcassonne/shared';
import {
  getLegalMeeplePlacements,
  getLegalTilePlacements
} from '@carcassonne/shared';

interface RandyPlacementInput {
  board: BoardState;
  currentTileId: string | null;
}

export function chooseRandyTilePlacement(game: RandyPlacementInput): PlacementOption | null {
  if (!game.currentTileId) {
    return null;
  }

  const allOptions = getLegalTilePlacements(game.board, game.currentTileId);
  if (allOptions.length === 0) {
    return null;
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

export function chooseRandyMeeplePlacement(game: GameState): MeeplePlacement | null {
  const placements = getLegalMeeplePlacements(game);
  const choiceCount = placements.length + 1;
  const selectedIndex = Math.floor(Math.random() * choiceCount);
  if (selectedIndex === 0) {
    return null;
  }

  return placements[selectedIndex - 1] ?? null;
}

function shuffleOrientations(orientations: Orientation[]): Orientation[] {
  const values = [...orientations];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function pickRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}
