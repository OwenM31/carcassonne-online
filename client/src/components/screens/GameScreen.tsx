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
import { buildSandboxDeckEntries } from '../../state/sandboxDeck';
import { Button } from '../atoms/Button';
import { BoardView } from '../organisms/BoardView';
import { GameHud } from '../organisms/GameHud';
import { GamePlacementPanel } from '../organisms/GamePlacementPanel';
import { SandboxTileSelector } from '../organisms/SandboxTileSelector';
const ORIENTATIONS: Orientation[] = [0, 90, 180, 270];
interface GameScreenProps {
  game: GameState;
  playerId: string;
  onDrawTile: () => void;
  onDrawSandboxTile: (tileId: TileId) => void;
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
  onDrawSandboxTile,
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
  const [selectedSandboxTileId, setSelectedSandboxTileId] = useState<TileId | null>(null);
  const isSandbox = game.mode === 'sandbox';
  const currentTileId = game.currentTileId;
  const isActivePlayer = activePlayer?.id === playerId;
  const canDrawStandardTile =
    isActivePlayer &&
    game.phase === 'draw_tile' &&
    !currentTileId &&
    game.tileDeck.length > 0;
  const canDrawSandboxTile =
    isSandbox &&
    isActivePlayer &&
    game.phase === 'draw_tile' &&
    !currentTileId &&
    !!selectedSandboxTileId &&
    game.tileDeck.length > 0;
  const canDrawTile = isSandbox ? canDrawSandboxTile : canDrawStandardTile;
  const canPlaceTile = isActivePlayer && game.phase === 'place_tile' && !!currentTileId;
  const canPlaceMeeple = isActivePlayer && game.phase === 'place_meeple';
  useEffect(() => {
    setOrientation(0);
  }, [currentTileId, game.id]);
  const sandboxDeckEntries = useMemo(() => buildSandboxDeckEntries(game.tileDeck), [game.tileDeck]);
  useEffect(() => {
    if (!isSandbox) {
      setSelectedSandboxTileId(null);
      return;
    }

    if (!selectedSandboxTileId || !sandboxDeckEntries.some((entry) => entry.tileId === selectedSandboxTileId)) {
      setSelectedSandboxTileId(sandboxDeckEntries[0]?.tileId ?? null);
    }
  }, [isSandbox, sandboxDeckEntries, selectedSandboxTileId]);
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
  const handleDrawTile = () => {
    if (isSandbox) {
      if (!selectedSandboxTileId) {
        return;
      }
      onDrawSandboxTile(selectedSandboxTileId);
      return;
    }

    onDrawTile();
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
          <GamePlacementPanel
            isActivePlayer={isActivePlayer}
            statusText={statusText}
            canDrawTile={canDrawTile}
            isSandbox={isSandbox}
            canPlaceTile={canPlaceTile}
            orientation={orientation}
            canPlaceMeeple={canPlaceMeeple}
            currentTileId={currentTileId}
            error={error}
            onDrawTile={handleDrawTile}
            onUndo={onUndo}
            onRotate={handleRotate}
            onSkipMeeple={onSkipMeeple}
          />
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
          {isSandbox ? (
            <SandboxTileSelector
              entries={sandboxDeckEntries}
              selectedTileId={selectedSandboxTileId}
              onSelectTile={setSelectedSandboxTileId}
              onDrawSelected={handleDrawTile}
              canDrawSelected={canDrawSandboxTile}
            />
          ) : null}
        </section>
        <GameHud hud={hud} />
      </div>
    </main>
  );
}
