/**
 * @description Game screen layout, tile placement flow, and optional meeple placement controls.
 */
import { useEffect, useMemo, useState } from 'react';
import type { GameState, MeeplePlacement, Orientation, PlacementOption, TileId } from '@carcassonne/shared';
import { getLegalMeeplePlacements, getLegalTilePlacements } from '@carcassonne/shared';
import { buildGameHudState } from '../../state/gameHud';
import { useGameReplay } from '../../state/gameReplay';
import { getStatusText } from '../../state/gameStatusText';
import { buildSandboxDeckEntries } from '../../state/sandboxDeck';
import { Button } from '../atoms/Button';
import { BoardView } from '../organisms/BoardView';
import { GameHud } from '../organisms/GameHud';
import { GamePlacementPanel } from '../organisms/GamePlacementPanel';
import { GameReplayHotbar } from '../organisms/GameReplayHotbar';
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
  onResetSandboxBoard: () => void;
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
  onResetSandboxBoard,
  error,
  onExit
}: GameScreenProps) {
  const replay = useGameReplay(game);
  const viewGame = replay.viewGame;
  const hud = buildGameHudState(viewGame);
  const liveHud = buildGameHudState(game);
  const [orientation, setOrientation] = useState<Orientation>(0);
  const [selectedSandboxTileId, setSelectedSandboxTileId] = useState<TileId | null>(null);
  const isSandbox = game.mode === 'sandbox';
  const liveCurrentTileId = game.currentTileId;
  const viewCurrentTileId = viewGame.currentTileId;
  const isActivePlayer = replay.isCurrentView && liveHud.activePlayer?.id === playerId;
  const canDrawStandardTile = isActivePlayer && game.phase === 'draw_tile' && !liveCurrentTileId && game.tileDeck.length > 0;
  const canDrawSandboxTile = isSandbox && canDrawStandardTile && !!selectedSandboxTileId;
  const canDrawTile = isSandbox ? canDrawSandboxTile : canDrawStandardTile;
  const canPlaceTile = isActivePlayer && game.phase === 'place_tile' && !!liveCurrentTileId;
  const canPlaceMeeple = isActivePlayer && game.phase === 'place_meeple';
  const canUndo = isActivePlayer;
  const canResetSandbox = isSandbox && isActivePlayer;
  useEffect(() => setOrientation(0), [viewCurrentTileId, viewGame.id]);
  const sandboxDeckEntries = useMemo(() => buildSandboxDeckEntries(viewGame.tileDeck), [viewGame.tileDeck]);
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
    if (!liveCurrentTileId || !canPlaceTile) {
      return [];
    }
    return getLegalTilePlacements(game.board, liveCurrentTileId).filter((option) => option.orientation === orientation);
  }, [canPlaceTile, game.board, liveCurrentTileId, orientation]);
  const meepleOptions = useMemo(() => (canPlaceMeeple ? getLegalMeeplePlacements(game) : []), [canPlaceMeeple, game]);
  const statusText = replay.isCurrentView
    ? getStatusText(game, isActivePlayer, liveHud.activePlayer?.name, meepleOptions)
    : `Read-only replay after turn ${replay.replayTurn}. Use jump to current to resume play.`;
  const playerColorById = useMemo(
    () => viewGame.players.reduce<Record<string, typeof viewGame.players[number]['color']>>((index, player) => {
      index[player.id] = player.color;
      return index;
    }, {}),
    [viewGame.players]
  );
  const handleRotate = (step: number) => {
    setOrientation((prev) => ORIENTATIONS[(ORIENTATIONS.indexOf(prev) + step + ORIENTATIONS.length) % ORIENTATIONS.length]);
  };
  const handleDrawTile = () => {
    if (!replay.isCurrentView) {
      return;
    }

    if (isSandbox) {
      if (selectedSandboxTileId) {
        onDrawSandboxTile(selectedSandboxTileId);
      }
      return;
    }

    onDrawTile();
  };
  const handlePlaceTile = (placement: PlacementOption) => {
    if (liveCurrentTileId && canPlaceTile) {
      onPlaceTile(liveCurrentTileId, placement);
    }
  };
  const handleSelectEventGroup = (turn: number, isMostRecent: boolean) => {
    if (isMostRecent) {
      replay.jumpToCurrent();
      return;
    }
    replay.jumpToTurnCompletion(turn);
  };

  return (
    <main className="page game-page">
      <header className="hero game-hero">
        <div className="hero__copy">
          <p className="hero__kicker">Carcassonne Match</p>
          <h1 className="hero__title">Game {game.id}</h1>
          <p className="hero__subtitle">Turn {viewGame.turnNumber} · {hud.phaseLabel} · Active: {hud.activePlayer?.name ?? 'Unknown'}</p>
        </div>
        {onExit ? <Button type="button" variant="ghost" onClick={onExit}>Return to lobby</Button> : null}
      </header>
      <div className="game-layout">
        <section className="card game-board">
          <div className="board-header">
            <h2 className="card__title">Board</h2>
            <div className="board-stats">
              <span className="board-stat">Deck: {viewGame.tileDeck.length}</span>
              <span className="board-stat">Start: {viewGame.startingTileId}</span>
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
            canUndo={canUndo}
            currentTileId={viewCurrentTileId}
            error={error}
            onDrawTile={handleDrawTile}
            onUndo={onUndo}
            onRotate={handleRotate}
            onSkipMeeple={onSkipMeeple}
          />
          <BoardView
            board={viewGame.board}
            meeples={viewGame.meeples}
            playerColorById={playerColorById}
            highlightTileId={viewGame.startingTileId}
            placementOptions={replay.isCurrentView ? placements : []}
            placementTileId={replay.isCurrentView ? liveCurrentTileId : null}
            onPlaceTile={canPlaceTile ? handlePlaceTile : undefined}
            meeplePlacementOptions={replay.isCurrentView && canPlaceMeeple ? meepleOptions : []}
            onPlaceMeeple={replay.isCurrentView && canPlaceMeeple ? onPlaceMeeple : undefined}
          />
          <GameReplayHotbar
            replayTurn={replay.replayTurn}
            canStepBackward={replay.canStepBackward}
            canJumpCurrent={replay.canJumpCurrent}
            canStepForward={replay.canStepForward}
            showSandboxReset={isSandbox}
            canResetSandbox={canResetSandbox}
            onStepBackward={replay.stepBackward}
            onJumpCurrent={replay.jumpToCurrent}
            onStepForward={replay.stepForward}
            onResetSandbox={onResetSandboxBoard}
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
        <GameHud
          hud={hud}
          eventLog={game.eventLog}
          replayTurn={replay.replayTurn}
          onSelectEventGroup={handleSelectEventGroup}
        />
      </div>
    </main>
  );
}
