import { test, expect } from '@playwright/test';

test('Grass removal area verification', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  const grassData = await page.evaluate(() => {
    const worldSize = window.worldSize;
    const hfGridSize = window.hfGridSize;

    // Clear all existing clusters first for a clean test
    window.capimClusters.length = 0;

    const center = new window.THREE.Vector3(0, 0.8, 0);
    const clusterPos = new window.THREE.Vector3(0.5, 0.8, 0.5);
    window.capimClusters.push({
        position: clusterPos,
        poolIndex: 0,
        count: 6
    });

    if (!window.zeroMatrix) {
        window.zeroMatrix = new window.THREE.Matrix4().set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    }

    if (!window.capimInstancedMeshes || !window.capimInstancedMeshes[0]) {
        window.capimInstancedMeshes = [{
            setMatrixAt: () => {},
            instanceMatrix: { needsUpdate: false }
        }];
    }

    if (!window.capimFreeIndices) window.capimFreeIndices = [];

    const testMeters = (7.0 * (hfGridSize / worldSize) + 0.3) * (worldSize / (hfGridSize - 1));
    const dist = window.calculateWrappedDistance(center, clusterPos);

    const removedCount = window.removeCapimNear(center, testMeters);

    return {
        dist: dist,
        testMeters: testMeters,
        removedCount: removedCount,
        clustersLeft: window.capimClusters.length
    };
  });

  console.log('Grass Data:', grassData);
  expect(grassData.removedCount).toBe(1);
  expect(grassData.clustersLeft).toBe(0);
});
