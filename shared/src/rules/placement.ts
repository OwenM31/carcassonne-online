import {
  BoardState,
  Coordinate,
  GameState,
  Orientation,
  PlacementOption,
  TileId
} from '../types/game';
import { FULL_TILE_CATALOG, type Edge, type EdgeType, type TileCatalogEntry } from '../tiles';
import { toBoardKey } from './board';
import { isRiverPlacementAllowed } from './river2Placement';

const EDGES: Edge[] = ['N', 'E', 'S', 'W'];
const ORIENTATIONS: Orientation[] = [0, 90, 180, 270];
const EDGE_ORDER: Edge[] = ['N', 'E', 'S', 'W'];
const ORIENTATION_STEPS: Record<Orientation, number> = {
  0: 0,
  90: 1,
  180: 2,
  270: 3
};

const EDGE_DELTAS: Record<Edge, { dx: number; dy: number; opposite: Edge }> = {
  N: { dx: 0, dy: 1, opposite: 'S' },
  E: { dx: 1, dy: 0, opposite: 'W' },
  S: { dx: 0, dy: -1, opposite: 'N' },
  W: { dx: -1, dy: 0, opposite: 'E' }
};

const findTile = (
  tileId: TileId,
  catalog: TileCatalogEntry[]
): TileCatalogEntry | undefined =>
  catalog.find((tile) => tile.id === tileId);

const rotateEdges = (
  edges: Record<Edge, EdgeType>,
  orientation: Orientation
): Record<Edge, EdgeType> => {
  const steps = ORIENTATION_STEPS[orientation];
  const rotated = {} as Record<Edge, EdgeType>;

  for (let index = 0; index < EDGE_ORDER.length; index += 1) {
    const edge = EDGE_ORDER[index];
    const sourceIndex = (index - steps + EDGE_ORDER.length) % EDGE_ORDER.length;
    rotated[edge] = edges[EDGE_ORDER[sourceIndex]];
  }

  return rotated;
};

const getTileEdges = (
  tileId: TileId,
  orientation: Orientation,
  catalog: TileCatalogEntry[]
): Record<Edge, EdgeType> | null => {
  const entry = findTile(tileId, catalog);

  if (!entry) {
    return null;
  }

  return rotateEdges(entry.features.edges, orientation);
};

const getCandidatePositions = (board: BoardState): Coordinate[] => {
  const candidates = new Map<string, Coordinate>();

  for (const tile of Object.values(board.tiles)) {
    for (const edge of EDGES) {
      const delta = EDGE_DELTAS[edge];
      const position = {
        x: tile.position.x + delta.dx,
        y: tile.position.y + delta.dy
      };
      const key = toBoardKey(position);

      if (!board.tiles[key]) {
        candidates.set(key, position);
      }
    }
  }

  return [...candidates.values()];
};

export const isTilePlacementValid = (
  board: BoardState,
  tileId: TileId,
  position: Coordinate,
  orientation: Orientation,
  catalog: TileCatalogEntry[] = FULL_TILE_CATALOG
): boolean => {
  const key = toBoardKey(position);

  if (board.tiles[key]) {
    return false;
  }

  const tileEdges = getTileEdges(tileId, orientation, catalog);

  if (!tileEdges) {
    return false;
  }

  let hasNeighbor = false;

  for (const edge of EDGES) {
    const delta = EDGE_DELTAS[edge];
    const neighborPosition = {
      x: position.x + delta.dx,
      y: position.y + delta.dy
    };
    const neighbor = board.tiles[toBoardKey(neighborPosition)];

    if (!neighbor) {
      continue;
    }

    hasNeighbor = true;

    const neighborEdges = getTileEdges(
      neighbor.tileId,
      neighbor.orientation,
      catalog
    );

    if (!neighborEdges || tileEdges[edge] !== neighborEdges[delta.opposite]) {
      return false;
    }
  }

  return hasNeighbor;
};

export const getLegalTilePlacements = (
  board: BoardState,
  tileId: TileId,
  catalog: TileCatalogEntry[] = FULL_TILE_CATALOG
): PlacementOption[] => {
  if (!findTile(tileId, catalog)) {
    return [];
  }

  const placements: PlacementOption[] = [];
  const candidates = getCandidatePositions(board);

  for (const position of candidates) {
    for (const orientation of ORIENTATIONS) {
      if (isTilePlacementValid(board, tileId, position, orientation, catalog)) {
        placements.push({ position, orientation });
      }
    }
  }

  return placements;
};

export const isTilePlacementValidForState = (
  state: GameState,
  tileId: TileId,
  position: Coordinate,
  orientation: Orientation,
  catalog: TileCatalogEntry[] = FULL_TILE_CATALOG
): boolean =>
  isTilePlacementValid(state.board, tileId, position, orientation, catalog) &&
  isRiverPlacementAllowed(state, tileId, position, orientation, catalog);

export const getLegalTilePlacementsForState = (
  state: GameState,
  tileId: TileId,
  catalog: TileCatalogEntry[] = FULL_TILE_CATALOG
): PlacementOption[] =>
  getLegalTilePlacements(state.board, tileId, catalog).filter((option) =>
    isRiverPlacementAllowed(state, tileId, option.position, option.orientation, catalog)
  );
