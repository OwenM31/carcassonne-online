import { GameAction, GameSetup, GameState, PlacementOption, TileId } from '../types/game';

export interface RulesEngine {
  createGame(setup: GameSetup): GameState;
  getLegalTilePlacements(state: GameState, tileId: TileId): PlacementOption[];
  applyAction(state: GameState, action: GameAction): GameState;
}
