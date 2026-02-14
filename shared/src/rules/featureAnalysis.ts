/**
 * @description Connected-feature graph analysis for cities, roads, farms, and monasteries.
 */
import type {
  BoardState,
  FeatureCounter,
  FeatureType,
  MeeplePlacement,
  PlacedMeeple
} from '../types/game';
import { toFeatureKey } from './featureKeys';
import { buildFeatureNodes, buildTileDefinitionIndex } from './featureNodes';

export interface FeatureComponent {
  id: string;
  type: FeatureType;
  featureKeys: string[];
  tileKeys: string[];
  openEnds: number;
  pennants: number;
  adjacentCityComponentIds: string[];
}

export interface BoardFeatureAnalysis {
  summary: FeatureCounter;
  componentByFeatureKey: Record<string, string>;
  components: FeatureComponent[];
}

export function analyzeBoardFeatures(board: BoardState): BoardFeatureAnalysis {
  const componentByFeatureKey: Record<string, string> = {};
  const summary: FeatureCounter = {
    cities: { total: 0, open: 0, closed: 0 },
    roads: { total: 0, open: 0, closed: 0 },
    monasteries: 0,
    grasslands: 0
  };
  const components: FeatureComponent[] = [];
  const farmAdjacentCityFeatures: Record<string, string[]> = {};
  const nodes = buildFeatureNodes(board, buildTileDefinitionIndex(board));

  let componentIndex = 0;
  Object.keys(nodes).forEach((key) => {
    if (componentByFeatureKey[key]) {
      return;
    }

    const node = nodes[key];
    if (!node) {
      return;
    }

    const componentId = `${node.type}:${componentIndex}`;
    componentIndex += 1;
    const tileKeys = new Set<string>();
    const featureKeys: string[] = [];
    const adjacentCityFeatures = new Set<string>();
    const queue = [key];
    componentByFeatureKey[key] = componentId;
    let openEnds = 0;
    let pennants = 0;

    while (queue.length > 0) {
      const currentKey = queue.shift();
      if (!currentKey) {
        continue;
      }

      const currentNode = nodes[currentKey];
      if (!currentNode || currentNode.type !== node.type) {
        continue;
      }

      featureKeys.push(currentNode.key);
      tileKeys.add(currentNode.tileKey);
      openEnds += currentNode.openEnds;
      pennants += currentNode.pennants;
      currentNode.adjacentCityFeatureKeys.forEach((featureKey) =>
        adjacentCityFeatures.add(featureKey)
      );

      currentNode.neighbors.forEach((neighborKey) => {
        if (componentByFeatureKey[neighborKey]) {
          return;
        }
        componentByFeatureKey[neighborKey] = componentId;
        queue.push(neighborKey);
      });
    }

    if (node.type === 'city') {
      summary.cities.total += 1;
      if (openEnds === 0) {
        summary.cities.closed += 1;
      } else {
        summary.cities.open += 1;
      }
    } else if (node.type === 'road') {
      summary.roads.total += 1;
      if (openEnds === 0) {
        summary.roads.closed += 1;
      } else {
        summary.roads.open += 1;
      }
    } else if (node.type === 'farm') {
      summary.grasslands += 1;
    } else {
      summary.monasteries += 1;
    }

    components.push({
      id: componentId,
      type: node.type,
      featureKeys,
      tileKeys: [...tileKeys],
      openEnds,
      pennants,
      adjacentCityComponentIds: []
    });

    if (node.type === 'farm') {
      farmAdjacentCityFeatures[componentId] = [...adjacentCityFeatures];
    }
  });

  components.forEach((component) => {
    if (component.type !== 'farm') {
      return;
    }

    const cityComponentIds = new Set<string>();
    (farmAdjacentCityFeatures[component.id] ?? []).forEach((featureKey) => {
      const cityComponentId = componentByFeatureKey[featureKey];
      if (cityComponentId) {
        cityComponentIds.add(cityComponentId);
      }
    });
    component.adjacentCityComponentIds = [...cityComponentIds];
  });

  return { summary, componentByFeatureKey, components };
}

export function isConnectedFeatureOccupied(
  board: BoardState,
  meeples: PlacedMeeple[],
  placement: MeeplePlacement,
  analysis: BoardFeatureAnalysis = analyzeBoardFeatures(board)
): boolean {
  const targetKey = toFeatureKey(
    placement.tilePosition,
    placement.featureType,
    placement.featureIndex
  );
  const targetComponent = analysis.componentByFeatureKey[targetKey];
  if (!targetComponent) {
    return false;
  }

  return meeples.some((meeple) => {
    const meepleKey = toFeatureKey(
      meeple.tilePosition,
      meeple.featureType,
      meeple.featureIndex
    );
    return analysis.componentByFeatureKey[meepleKey] === targetComponent;
  });
}
