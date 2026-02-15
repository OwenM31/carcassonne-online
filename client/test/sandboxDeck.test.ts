/**
 * @description Unit tests for sandbox deck entry derivation.
 */
import { buildSandboxDeckEntries } from '../src/state/sandboxDeck';

describe('buildSandboxDeckEntries', () => {
  it('aggregates remaining counts and omits depleted tile types', () => {
    const entries = buildSandboxDeckEntries(['T_R1C2', 'T_R1C2', 'T_R3C4']);
    const roadMonastery = entries.find((entry) => entry.tileId === 'T_R1C2');
    const startTile = entries.find((entry) => entry.tileId === 'T_R3C4');
    const missingTile = entries.find((entry) => entry.tileId === 'T_R1C1');

    expect(roadMonastery?.remaining).toBe(2);
    expect(startTile?.remaining).toBe(1);
    expect(missingTile).toBeUndefined();
  });
});
