/**
 * @description Parses game-action websocket payloads into typed client messages.
 */
import type { ClientMessage } from '@carcassonne/shared';
import {
  isCoordinate,
  isMeeplePlacement,
  isOrientation
} from './messageParserPredicates';

export function parseGameActionMessage(parsed: Record<string, unknown>): ClientMessage | null {
  if (parsed.type === 'draw_tile') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }
    return { type: 'draw_tile', sessionId: parsed.sessionId, playerId: parsed.playerId };
  }

  if (parsed.type === 'draw_sandbox_tile') {
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.playerId !== 'string' ||
      typeof parsed.tileId !== 'string'
    ) {
      return null;
    }
    return {
      type: 'draw_sandbox_tile',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId,
      tileId: parsed.tileId
    };
  }

  if (parsed.type === 'place_tile') {
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.playerId !== 'string' ||
      typeof parsed.tileId !== 'string'
    ) {
      return null;
    }
    if (!isCoordinate(parsed.position) || !isOrientation(parsed.orientation)) {
      return null;
    }
    return {
      type: 'place_tile',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId,
      tileId: parsed.tileId,
      position: parsed.position,
      orientation: parsed.orientation
    };
  }

  if (parsed.type === 'place_meeple') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }
    if (!isMeeplePlacement(parsed.placement)) {
      return null;
    }
    return {
      type: 'place_meeple',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId,
      placement: parsed.placement
    };
  }

  if (parsed.type === 'skip_meeple') {
    if (typeof parsed.sessionId !== 'string' || typeof parsed.playerId !== 'string') {
      return null;
    }
    return { type: 'skip_meeple', sessionId: parsed.sessionId, playerId: parsed.playerId };
  }

  if (parsed.type === 'set_tile_orientation') {
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.playerId !== 'string' ||
      !isOrientation(parsed.orientation)
    ) {
      return null;
    }

    return {
      type: 'set_tile_orientation',
      sessionId: parsed.sessionId,
      playerId: parsed.playerId,
      orientation: parsed.orientation
    };
  }

  return null;
}
