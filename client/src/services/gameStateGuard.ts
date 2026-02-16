/**
 * @description Runtime guard for game state payloads from the server.
 */
import type { GameState } from '@carcassonne/shared';
import { SESSION_ADDONS } from '@carcassonne/shared';
import {
  isBoardState,
  isGameEvent,
  isGameStatus,
  isOrientation,
  isPlacedMeeple,
  isPlacedTile,
  isPlayerState,
  isRecord,
  isSessionMode,
  isTurnPhase
} from './gameStateGuardChecks';

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.id !== 'string') {
    return false;
  }

  if (!isSessionMode(value.mode)) {
    return false;
  }

  if (
    !Array.isArray(value.addons) ||
    value.addons.some(
      (addon) =>
        typeof addon !== 'string' ||
        !SESSION_ADDONS.includes(addon as (typeof SESSION_ADDONS)[number])
    )
  ) {
    return false;
  }

  if (!isGameStatus(value.status) || !isTurnPhase(value.phase)) {
    return false;
  }

  if (!Array.isArray(value.players) || value.players.some((player) => !isPlayerState(player))) {
    return false;
  }

  if (!isBoardState(value.board)) {
    return false;
  }

  if (!Array.isArray(value.tileDeck) || value.tileDeck.some((tile) => typeof tile !== 'string')) {
    return false;
  }

  if (
    !Array.isArray(value.tileDiscard) ||
    value.tileDiscard.some((tile) => typeof tile !== 'string')
  ) {
    return false;
  }

  if (typeof value.startingTileId !== 'string') {
    return false;
  }

  if (value.currentTileId !== null && typeof value.currentTileId !== 'string') {
    return false;
  }
  if (value.currentTileOrientation !== null && !isOrientation(value.currentTileOrientation)) {
    return false;
  }

  if (value.lastPlacedTile !== null && !isPlacedTile(value.lastPlacedTile)) {
    return false;
  }

  if (!Array.isArray(value.meeples) || value.meeples.some((meeple) => !isPlacedMeeple(meeple))) {
    return false;
  }

  if (!Array.isArray(value.eventLog) || value.eventLog.some((entry) => !isGameEvent(entry))) {
    return false;
  }

  if (typeof value.activePlayerIndex !== 'number' || Number.isNaN(value.activePlayerIndex)) {
    return false;
  }

  if (typeof value.turnNumber !== 'number' || Number.isNaN(value.turnNumber)) {
    return false;
  }

  if (
    value.turnTimerSeconds !== 0 &&
    value.turnTimerSeconds !== 1 &&
    value.turnTimerSeconds !== 30 &&
    value.turnTimerSeconds !== 60 &&
    value.turnTimerSeconds !== 90
  ) {
    return false;
  }

  if (typeof value.turnStartedAt !== 'string') {
    return false;
  }

  return value.seed === undefined || typeof value.seed === 'string';
}
