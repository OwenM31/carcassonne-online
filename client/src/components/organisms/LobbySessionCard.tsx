/**
 * @description Renders one lobby session card with players and settings controls.
 */
import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react';
import type {
  PlayerColor,
  SessionAddon,
  SessionAiProfile,
  SessionDeckSize,
  SessionMode,
  SessionSummary,
  SessionTurnTimer
} from '@carcassonne/shared';
import {
  buildTileDeck,
  buildCatalogForAddons,
  type TileCatalogEntry,
  INNS_AND_CATHEDRALS_TILE_CATALOG,
  RIVER_TILE_CATALOG,
  RIVER_2_TILE_CATALOG
} from '@carcassonne/shared';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { LobbySessionPlayers } from './LobbySessionPlayers';

const AI_PROFILE_OPTIONS: SessionAiProfile[] = ['randy', 'martin', 'juan'];
const ADDON_OPTIONS: Array<{ id: SessionAddon; label: string; tileCount: number }> = [
  {
    id: 'inns_and_cathedrals',
    label: 'Inns and Cathedrals',
    tileCount: INNS_AND_CATHEDRALS_TILE_CATALOG.reduce((sum, tile) => sum + tile.count, 0)
  },
  {
    id: 'river',
    label: 'The River',
    tileCount: RIVER_TILE_CATALOG.reduce((sum, tile) => sum + tile.count, 0)
  },
  {
    id: 'river_2',
    label: 'The River 2',
    tileCount: RIVER_2_TILE_CATALOG.reduce((sum, tile) => sum + tile.count, 0)
  },
  {
    id: 'abbot',
    label: 'The Abbot',
    tileCount: buildCatalogForAddons(['abbot']).reduce(
      (sum, tile) => sum + (tile.id.startsWith('AB_') ? tile.count : 0),
      0
    )
  }
];
const TURN_TIMER_OPTIONS: SessionTurnTimer[] = [0, 1, 30, 60, 90];
const MAX_SESSION_PLAYERS = 6;
interface LobbySessionCardProps {
  index: number;
  session: SessionSummary;
  isConnected: boolean;
  isActive: boolean;
  hasActiveSession: boolean;
  canStartGame: boolean;
  minimumPlayersToStart: number;
  onJoinSession: (sessionId: string) => void;
  onLeaveSession: () => void;
  onStartGame: () => void;
  onDeleteSession: (sessionId: string) => void;
  onSetSessionDeckSize: (sessionId: string, deckSize: SessionDeckSize) => void;
  onSetSessionMode: (sessionId: string, mode: SessionMode) => void;
  onSetSessionAddons: (sessionId: string, addons: SessionAddon[]) => void;
  onSetSessionPlayerColor: (
    sessionId: string,
    color: PlayerColor,
    targetPlayerId?: string
  ) => void;
  onSetSessionTurnTimer: (sessionId: string, turnTimerSeconds: SessionTurnTimer) => void;
  onAddAiPlayer: (sessionId: string, aiProfile: SessionAiProfile) => void;
  onRemoveAiPlayer: (sessionId: string, aiPlayerId: string) => void;
}
export function LobbySessionCard({
  index,
  session,
  isConnected,
  isActive,
  hasActiveSession,
  canStartGame,
  minimumPlayersToStart,
  onJoinSession,
  onLeaveSession,
  onStartGame,
  onDeleteSession,
  onSetSessionDeckSize,
  onSetSessionMode,
  onSetSessionAddons,
  onSetSessionPlayerColor,
  onSetSessionTurnTimer,
  onAddAiPlayer,
  onRemoveAiPlayer
}: LobbySessionCardProps) {
  const [isAiPickerOpen, setAiPickerOpen] = useState(false);
  const [isAddonsPickerOpen, setAddonsPickerOpen] = useState(false);
  const isInProgress = session.status === 'in_progress';
  const statusLabel = isInProgress ? 'In progress' : 'Lobby';
  const canConnect = isConnected && !hasActiveSession;
  const canDisconnect = isConnected && isActive;
  const canDelete = isConnected && !hasActiveSession;
  const canChangeSettings = isConnected && !isInProgress;
  const showAddAiButton = !isInProgress && session.playerCount < MAX_SESSION_PLAYERS;
  const canAddAiPlayer = canChangeSettings && session.playerCount < MAX_SESSION_PLAYERS;
  const canRemoveAiPlayer = canChangeSettings;
  const showStartHint = isActive && isConnected && !isInProgress && !canStartGame;
  const canStartSession = isActive && canStartGame && !isInProgress;
  const deckSliderValue = session.deckSize === 'small' ? 0 : 1;
  const turnTimerIndex = Math.max(0, TURN_TIMER_OPTIONS.indexOf(session.turnTimerSeconds));
  const standardTileCount = buildTileDeck(undefined, 'standard', session.addons).length;
  const smallTileCount = buildTileDeck(undefined, 'small', session.addons).length;
  const tileCountLabel = isInProgress
    ? `${session.tileCount} tiles remaining`
    : `${session.tileCount} tiles`;
  const modeLabel = formatSessionModeLabel(session.mode, session.addons);

  useEffect(() => {
    if (!showAddAiButton) setAiPickerOpen(false);
  }, [showAddAiButton]);

  useEffect(() => {
    if (!canChangeSettings) {
      setAddonsPickerOpen(false);
    }
  }, [canChangeSettings]);

  const handleDeckSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDeckSize: SessionDeckSize = event.target.value === '0' ? 'small' : 'standard';
    if (nextDeckSize !== session.deckSize) onSetSessionDeckSize(session.id, nextDeckSize);
  };

  const handleModeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextMode: SessionMode = event.target.checked ? 'sandbox' : 'standard';
    if (nextMode !== session.mode) onSetSessionMode(session.id, nextMode);
  };

  const handleTurnTimerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedIndex = Number(event.target.value);
    const nextTurnTimer = TURN_TIMER_OPTIONS[selectedIndex] ?? TURN_TIMER_OPTIONS[0];
    if (nextTurnTimer !== session.turnTimerSeconds) onSetSessionTurnTimer(session.id, nextTurnTimer);
  };

  const handleAddonToggle = (addon: SessionAddon, checked: boolean) => {
    const nextAddons = checked
      ? [...session.addons, addon]
      : session.addons.filter((entry) => entry !== addon);
    if (
      nextAddons.length === session.addons.length &&
      nextAddons.every((entry, index) => entry === session.addons[index])
    ) {
      return;
    }
    onSetSessionAddons(session.id, nextAddons);
  };

  const activeCatalogTileCount = countCatalogTiles(buildCatalogForAddons(session.addons));

  return (
    <li className="session-item" style={{ '--stagger': `${index * 0.08}s` } as CSSProperties}>
      <div className="session-item__header">
        <Badge tone={isInProgress ? 'warning' : 'neutral'}>{statusLabel}</Badge>
        <div className="session-item__meta">
          <span className="session-id">{session.id}</span>
          <span className="session-mode">{modeLabel}</span>
        </div>
      </div>

      <div className="session-item__columns">
        <section className="session-column session-column--players">
          <div className="session-column__header">
            <h3 className="session-column__title">Players</h3>
            <div className="session-counts">
              <span className="players-count">{session.playerCount}/{MAX_SESSION_PLAYERS}</span>
              <span className="session-tile-count">{tileCountLabel}</span>
            </div>
            {showAddAiButton ? (
              <button
                type="button"
                className="session-add-ai"
                onClick={() => setAiPickerOpen((open) => !open)}
                disabled={!canAddAiPlayer}
                aria-label="Add AI player"
              >
                +
              </button>
            ) : null}
          </div>
          {isAiPickerOpen ? (
            <div className="session-ai-picker" role="group" aria-label="AI bot selection">
              {AI_PROFILE_OPTIONS.map((profile) => (
                <Button
                  key={`${session.id}-ai-${profile}`}
                  type="button"
                  variant="ghost"
                  disabled={!canAddAiPlayer}
                  onClick={() => {
                    onAddAiPlayer(session.id, profile);
                    setAiPickerOpen(false);
                  }}
                >
                  {profile.toUpperCase()}
                </Button>
              ))}
            </div>
          ) : null}
          <LobbySessionPlayers
            sessionId={session.id}
            players={session.players}
            canRemoveAiPlayer={canRemoveAiPlayer}
            canEditPlayerColors={canChangeSettings && isActive}
            onRemoveAiPlayer={onRemoveAiPlayer}
            onSetSessionPlayerColor={onSetSessionPlayerColor}
          />
        </section>
        <section className="session-column session-column--settings">
          <label className="session-setting" htmlFor={`deck-size-${session.id}`}>
            <span className="session-setting__title">Deck size</span>
            <input
              id={`deck-size-${session.id}`}
              className="session-slider"
              type="range"
              min={0}
              max={1}
              step={1}
              value={deckSliderValue}
              onChange={handleDeckSizeChange}
              disabled={!canChangeSettings}
            />
            <span className="session-slider-labels">
              Small ({smallTileCount} tiles) · Large ({standardTileCount} tiles)
            </span>
          </label>

          <label className="session-setting" htmlFor={`turn-timer-${session.id}`}>
            <span className="session-setting__title">Turn timer</span>
            <input
              id={`turn-timer-${session.id}`}
              className="session-slider"
              type="range"
              min={0}
              max={TURN_TIMER_OPTIONS.length - 1}
              step={1}
              value={turnTimerIndex}
              onChange={handleTurnTimerChange}
              disabled={!canChangeSettings}
            />
            <span className="session-slider-labels">Unlimited · 30s · 60s · 90s</span>
          </label>

          <div className="session-setting">
            <div className="session-addons-header">
              <span className="session-setting__title">Add-ons</span>
              <button
                type="button"
                className="session-addons-toggle"
                onClick={() => setAddonsPickerOpen((open) => !open)}
                disabled={!canChangeSettings}
                aria-expanded={isAddonsPickerOpen}
                aria-controls={`session-addons-${session.id}`}
              >
                {session.addons.length === 0 ? 'None' : `${session.addons.length} selected`}
              </button>
            </div>
            {isAddonsPickerOpen ? (
              <div
                id={`session-addons-${session.id}`}
                className="session-addons-list"
                role="group"
                aria-label="Session add-ons"
              >
                {ADDON_OPTIONS.map((option) => {
                  const checked = session.addons.includes(option.id);
                  const compareAddons = checked
                    ? session.addons.filter((addon) => addon !== option.id)
                    : [...session.addons, option.id];
                  const compareTileCount = countCatalogTiles(buildCatalogForAddons(compareAddons));
                  const rawNetModifier = checked
                    ? activeCatalogTileCount - compareTileCount - option.tileCount
                    : compareTileCount - activeCatalogTileCount - option.tileCount;
                  const netModifier = shouldSuppressRiverPairPenalty(
                    option.id,
                    checked,
                    session.addons,
                    rawNetModifier
                  )
                    ? 0
                    : rawNetModifier;
                  const modifierLabel =
                    netModifier === 0
                      ? null
                      : netModifier > 0
                        ? ` (+${netModifier} ${Math.abs(netModifier) === 1 ? 'Bonus Tile' : 'Bonus Tiles'})`
                        : ` (${netModifier} ${Math.abs(netModifier) === 1 ? 'Tile' : 'Tiles'})`;
                  const modifierClass =
                    netModifier > 0
                      ? 'session-addon-modifier session-addon-modifier--positive'
                      : 'session-addon-modifier session-addon-modifier--negative';
                  return (
                    <label key={`${session.id}-addon-${option.id}`} className="session-checkbox">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canChangeSettings}
                        onChange={(event) => handleAddonToggle(option.id, event.target.checked)}
                      />
                      <span>
                        {option.label} ({option.tileCount} tiles)
                        {modifierLabel ? (
                          <span className={modifierClass}>{modifierLabel}</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>

          <label className="session-checkbox" htmlFor={`sandbox-mode-${session.id}`}>
            <input
              id={`sandbox-mode-${session.id}`}
              type="checkbox"
              checked={session.mode === 'sandbox'}
              onChange={handleModeChange}
              disabled={!canChangeSettings}
            />
            <span>Sandbox mode</span>
          </label>
          <div className="session-actions">
            <Button
              type="button"
              variant="primary"
              disabled={isActive ? !canDisconnect : !canConnect}
              onClick={() => (isActive ? onLeaveSession() : onJoinSession(session.id))}
            >
              {isActive ? 'Disconnect' : 'Connect'}
            </Button>
            <Button type="button" variant="primary" disabled={!canStartSession} onClick={onStartGame}>
              Start
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!canDelete}
              onClick={() => onDeleteSession(session.id)}
            >
              Delete
            </Button>
          </div>
          {showStartHint ? (
            <p className="hint">Waiting for at least {minimumPlayersToStart} player(s) to start.</p>
          ) : null}
        </section>
      </div>
    </li>
  );
}

function formatSessionModeLabel(mode: SessionMode, addons: SessionAddon[]): string {
  const modeLabel = mode === 'sandbox' ? 'Sandbox' : 'Standard';
  const addonLabels = addons.map((addon) => {
    const option = ADDON_OPTIONS.find((entry) => entry.id === addon);
    return option?.label ?? addon;
  });

  return [modeLabel, ...addonLabels].join(' + ');
}

function countCatalogTiles(catalog: TileCatalogEntry[]): number {
  return catalog.reduce((sum, tile) => sum + tile.count, 0);
}

function shouldSuppressRiverPairPenalty(
  option: SessionAddon,
  checked: boolean,
  addons: SessionAddon[],
  netModifier: number
): boolean {
  if (netModifier !== -2 || !checked) {
    return false;
  }

  if (!addons.includes('river') || !addons.includes('river_2')) {
    return false;
  }

  if (option !== 'river' && option !== 'river_2') {
    return false;
  }

  const riverIndex = addons.indexOf('river');
  const river2Index = addons.indexOf('river_2');
  if (riverIndex < 0 || river2Index < 0) {
    return false;
  }

  const firstSelected = riverIndex < river2Index ? 'river' : 'river_2';
  return option === firstSelected;
}
