/**
 * @description Game screen layout, tile placement flow, and optional meeple placement controls.
 */
import { useEffect, useMemo, useState } from 'react';
import type {
  GameState,
  MeeplePlacement,
  Orientation,
  PlacementOption,
  TileId
} from '@carcassonne/shared';
import { getLegalMeeplePlacements, getLegalTilePlacements } from '@carcassonne/shared';
import { buildGameHudState } from '../../state/gameHud';
import { getStatusText } from '../../state/gameStatusText';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { TileSprite } from '../atoms/TileSprite';
import { BoardView } from '../organisms/BoardView';
import { GameHud } from '../organisms/GameHud';
import { MeepleActions } from '../organisms/MeepleActions';
const ORIENTATIONS: Orientation[] = [0, 90, 180, 270];
const PLACEMENT_TILE_SIZE_REM = 5.5;

interface GameScreenProps {
  game: GameState;
  playerId: string;
  onDrawTile: () => void;
  onPlaceTile: (tileId: TileId, placement: PlacementOption) => void;
  onPlaceMeeple: (placement: MeeplePlacement) => void;
  onSkipMeeple: () => void;
  onUndo: () => void;
  error?: string | null;
  onExit?: () => void;
}

export function GameScreen({
  game,
  playerId,
  onDrawTile,
  onPlaceTile,
  onPlaceMeeple,
  onSkipMeeple,
  onUndo,
  error,
  onExit
}: GameScreenProps) {
  const hud = buildGameHudState(game);
  const activePlayer = hud.activePlayer;
  const [orientation, setOrientation] = useState<Orientation>(0);
  const currentTileId = game.currentTileId;
  const isActivePlayer = activePlayer?.id === playerId;
  const canDrawTile = isActivePlayer && game.phase === 'draw_tile' && !currentTileId;
  const canPlaceTile = isActivePlayer && game.phase === 'place_tile' && !!currentTileId;
  const canPlaceMeeple = isActivePlayer && game.phase === 'place_meeple';

  useEffect(() => {
    setOrientation(0);
  }, [currentTileId, game.id]);
  const placements = useMemo(() => {
    if (!currentTileId || !canPlaceTile) {
      return [];
    }

    return getLegalTilePlacements(game.board, currentTileId).filter(
      (option) => option.orientation === orientation
    );
  }, [canPlaceTile, currentTileId, game.board, orientation]);

  const meepleOptions = useMemo(() => {
    if (!canPlaceMeeple) {
      return [];
    }

    return getLegalMeeplePlacements(game);
  }, [canPlaceMeeple, game]);
  const statusText = getStatusText(game, isActivePlayer, activePlayer?.name, meepleOptions);
  const playerColorById = useMemo(
    () =>
      game.players.reduce<Record<string, typeof game.players[number]['color']>>(
        (index, player) => {
          index[player.id] = player.color;
          return index;
        },
        {}
      ),
    [game.players]
  );

  const handleRotate = (step: number) => {
    setOrientation((prev) => {
      const index = ORIENTATIONS.indexOf(prev);
      const nextIndex = (index + step + ORIENTATIONS.length) % ORIENTATIONS.length;
      return ORIENTATIONS[nextIndex];
    });
  };

  const handlePlaceTile = (placement: PlacementOption) => {
    if (!currentTileId || !canPlaceTile) {
      return;
    }

    onPlaceTile(currentTileId, placement);
  };

  return (
    <main className="page game-page">
      <header className="hero game-hero">
        <div className="hero__copy">
          <p className="hero__kicker">Carcassonne Match</p>
          <h1 className="hero__title">Game {game.id}</h1>
          <p className="hero__subtitle">
            Turn {game.turnNumber} · {hud.phaseLabel} · Active: {activePlayer?.name ?? 'Unknown'}
          </p>
        </div>
        {onExit ? (
          <Button type="button" variant="ghost" onClick={onExit}>
            Return to lobby
          </Button>
        ) : null}
      </header>

      <div className="game-layout">
        <section className="card game-board">
          <div className="board-header">
            <h2 className="card__title">Board</h2>
            <div className="board-stats">
              <span className="board-stat">Deck: {game.tileDeck.length}</span>
              <span className="board-stat">Start: {game.startingTileId}</span>
            </div>
          </div>
          <div className="placement-panel">
            <div className="placement-status">
              <Badge tone={isActivePlayer ? 'positive' : 'neutral'}>
                {isActivePlayer ? 'Your turn' : 'Waiting'}
              </Badge>
              <p className="hint">{statusText}</p>
            </div>
            <div className="placement-actions">
              <Button type="button" variant="primary" disabled={!canDrawTile} onClick={onDrawTile}>
                Draw tile
              </Button>
              <Button type="button" variant="ghost" onClick={onUndo}>
                Undo
              </Button>
              <div className="rotation-controls">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!canPlaceTile}
                  onClick={() => handleRotate(-1)}
                >
                  Rotate left
                </Button>
                <span className="rotation-value">{orientation}°</span>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!canPlaceTile}
                  onClick={() => handleRotate(1)}
                >
                  Rotate right
                </Button>
              </div>
              <MeepleActions
                disabled={!canPlaceMeeple}
                onSkipMeeple={onSkipMeeple}
              />
            </div>
            <div className="placement-tile-slot">
              {currentTileId ? (
                <TileSprite
                  tileId={currentTileId}
                  sizeRem={PLACEMENT_TILE_SIZE_REM}
                  orientation={orientation}
                />
              ) : (
                <p className="hud-tile-placeholder">No tile drawn.</p>
              )}
              <p className="hud-tile-id">{currentTileId ?? '—'}</p>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </div>
          <BoardView
            board={game.board}
            meeples={game.meeples}
            playerColorById={playerColorById}
            highlightTileId={game.startingTileId}
            placementOptions={placements}
            placementTileId={currentTileId}
            onPlaceTile={canPlaceTile ? handlePlaceTile : undefined}
            meeplePlacementOptions={canPlaceMeeple ? meepleOptions : []}
            onPlaceMeeple={canPlaceMeeple ? onPlaceMeeple : undefined}
          />
        </section>

        <GameHud hud={hud} />
      </div>
    </main>
  );
}
