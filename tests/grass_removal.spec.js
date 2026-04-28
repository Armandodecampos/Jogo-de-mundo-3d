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

  // Verify grass exists near (10, 10)
  let grassCountBefore = await page.evaluate(() => {
    const pos = new window.THREE.Vector3(10, 0, 10);
    return window.capimClusters.filter(c =>
        window.calculateWrappedDistance(pos, c.position) < 2.0
    ).length;
  });
  expect(grassCountBefore).toBeGreaterThan(0);

  // Dig at (10, 10)
  const removalRadius = await page.evaluate(() => {
    const intersect = {
      point: new window.THREE.Vector3(10, window.getSurfaceHeight(10, 10), 10),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };
    const mound = window.createMound(intersect, false);
    const worldStep = 1200 / 200; // worldSize / hfGridSize
    return (mound.radius + 0.5) * worldStep;
  });

  // Verify grass was removed within the calculated radius
  let grassCountAfter = await page.evaluate((radius) => {
    const pos = new window.THREE.Vector3(10, 0, 10);
    return window.capimClusters.filter(c =>
        window.calculateWrappedDistance(pos, c.position) < radius
    ).length;
  }, removalRadius);
  expect(grassCountAfter).toBe(0);
});
