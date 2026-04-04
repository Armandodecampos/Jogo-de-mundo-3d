import { test, expect } from '@playwright/test';

test('Terrain digging verification', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  // Wait for world to be ready (increased timeout for asset loading)
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // Verify worldSize
  const worldSize = await page.evaluate(() => window.worldSize);
  expect(worldSize).toBe(1200);

  // Check if islandMeshes are present
  const islandMeshCount = await page.evaluate(() => window.islandMeshes.length);
  expect(islandMeshCount).toBe(9);

  // Try to create a mound (digging) - mock dependencies if necessary
  await page.evaluate(() => {
    // If assets not loaded yet, mock them for the test to avoid null check failure
    if (!window.holeGeometryTemplate) {
        window.holeGeometryTemplate = new window.THREE.SphereGeometry(0.1);
        window.holeMaterial = new window.THREE.MeshBasicMaterial({ color: 0x000000 });
    }
    const intersect = {
      point: new window.THREE.Vector3(0, 0.8, 0),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };
    window.createMound(intersect, false);
  });

  const moundCount = await page.evaluate(() => window.mounds.length);
  expect(moundCount).toBeGreaterThan(0);
});
