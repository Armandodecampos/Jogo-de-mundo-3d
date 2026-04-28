import { test, expect } from '@playwright/test';

test('Digging removes nearby grass', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // Place some grass at (10, surfaceHeight, 10) for testing if not already there
  await page.evaluate(() => {
    const pos = new window.THREE.Vector3(10, window.getSurfaceHeight(10, 10), 10);
    // Force a capim cluster there if possible
    if (window.capimFreeIndices.length > 0) {
        // Clear any existing at that exact spot if any (unlikely)
        window.removeCapimNear(pos, 5);
        // Add one
        const poolIndex = window.capimFreeIndices.pop();
        const cluster = {
            position: pos.clone(),
            poolIndex: poolIndex,
            count: 3
        };
        window.capimClusters.push(cluster);
        // Update matrix to make it visible
        const matrix = new window.THREE.Matrix4();
        matrix.setPosition(pos);
        window.capimInstancedMeshes[0].setMatrixAt(poolIndex * 6, matrix);
        window.capimInstancedMeshes[0].instanceMatrix.needsUpdate = true;
    }
  });

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
