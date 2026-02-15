/**
 * @description Sandbox-only tile picker for selecting the next tile and remaining counts.
 */
import type { TileId } from '@carcassonne/shared';
import { Button } from '../atoms/Button';
import { TileSprite } from '../atoms/TileSprite';
import type { SandboxDeckEntry } from '../../state/sandboxDeck';

const SANDBOX_TILE_SIZE_REM = 3.6;

interface SandboxTileSelectorProps {
  entries: SandboxDeckEntry[];
  selectedTileId: TileId | null;
  onSelectTile: (tileId: TileId) => void;
  onDrawSelected: () => void;
  canDrawSelected: boolean;
}

export function SandboxTileSelector({
  entries,
  selectedTileId,
  onSelectTile,
  onDrawSelected,
  canDrawSelected
}: SandboxTileSelectorProps) {
  return (
    <section className="sandbox-tray">
      <div className="sandbox-tray__header">
        <h3 className="sandbox-tray__title">Sandbox tile picker</h3>
        <Button type="button" variant="primary" disabled={!canDrawSelected} onClick={onDrawSelected}>
          Draw selected tile
        </Button>
      </div>
      <p className="hint">Choose any remaining tile type and keep normal placement/meeple rules.</p>
      <div className="sandbox-tray__tiles" role="list" aria-label="Sandbox tile picker">
        {entries.map((entry) => {
          const isSelected = entry.tileId === selectedTileId;

          return (
            <button
              key={entry.tileId}
              type="button"
              role="listitem"
              className={`sandbox-tile${isSelected ? ' sandbox-tile--selected' : ''}`}
              onClick={() => onSelectTile(entry.tileId)}
            >
              <TileSprite tileId={entry.tileId} sizeRem={SANDBOX_TILE_SIZE_REM} />
              <span className="sandbox-tile__id">{entry.tileId}</span>
              <span className="sandbox-tile__count">Remaining: {entry.remaining}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
