/**
 * @description Sandbox-only tile picker for selecting the next tile and remaining counts.
 */
import { useMemo, useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.tileId.toLowerCase().includes(query) || entry.label.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  return (
    <section className="sandbox-tray">
      <div className="sandbox-tray__header">
        <div className="sandbox-tray__controls">
          <h3 className="sandbox-tray__title">Sandbox tile picker</h3>
          <div className="sandbox-tray__search-container">
            <input
              type="text"
              className="sandbox-tray__search"
              placeholder="Search tiles (e.g. city, road, T_R1...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="sandbox-tray__search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>
        <Button type="button" variant="primary" disabled={!canDrawSelected} onClick={onDrawSelected}>
          Draw selected tile
        </Button>
      </div>
      <p className="hint">Choose any remaining tile type and keep normal placement/meeple rules.</p>
      <div className="sandbox-tray__tiles" role="list" aria-label="Sandbox tile picker">
        {filteredEntries.map((entry) => {
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
        {filteredEntries.length === 0 && (
          <div className="sandbox-tray__empty">No tiles match "{searchQuery}"</div>
        )}
      </div>
    </section>
  );
}
