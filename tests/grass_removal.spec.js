import { test, expect } from '@playwright/test';

test('Grass removal area verification', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  // Setup grass and check it exists
  const initialCheck = await page.evaluate(() => {
    const pos = new window.THREE.Vector3(10, 0, 10);
    // Ensure there is some grass at (10, 10)
    // The world population might already have some, but let's be sure
    if (window.capimClusters.filter(c => window.calculateWrappedDistance(pos, c.position) < 2.0).length === 0) {
        // Force spawn some grass if none exists
        for(let i=0; i<5; i++) {
            const p = pos.clone().add(new window.THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5));
            window.createCapim(p);
        }
    }

    return window.capimClusters.filter(c =>
        window.calculateWrappedDistance(pos, c.position) < 2.0
    ).length;
  });
  expect(initialCheck).toBeGreaterThan(0);

  // Dig at (10, 10) using createMound
  const result = await page.evaluate(() => {
    const pos = new window.THREE.Vector3(10, window.getSurfaceHeight(10, 10), 10);
    const intersect = {
      point: pos,
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };
    const mound = window.createMound(intersect, false);
    const worldStep = window.worldSize / window.hfGridSize;
    const removalRadius = (mound.radius + 0.5) * worldStep;

    // Verify grass is STILL THERE (new behavior: delayed removal)
    const countImmediatelyAfter = window.capimClusters.filter(c =>
        window.calculateWrappedDistance(pos, c.position) < removalRadius
    ).length;

    return { removalRadius, countImmediatelyAfter };
  });

  expect(result.countImmediatelyAfter).toBeGreaterThan(0);

  // Now simulate the completion of the first stage of digging
  await page.evaluate((radius) => {
    const pos = new window.THREE.Vector3(10, 0, 10);
    window.removeCapimNear(pos, radius);
  }, result.removalRadius);

  // Verify grass was removed
  const finalCount = await page.evaluate((radius) => {
    const pos = new window.THREE.Vector3(10, 0, 10);
    return window.capimClusters.filter(c =>
        window.calculateWrappedDistance(pos, c.position) < radius
    ).length;
  }, result.removalRadius);

  expect(finalCount).toBe(0);
});
