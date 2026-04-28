import { test, expect } from '@playwright/test';

test('isAreaOccupiedByConstruction with mounds radius verification', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  const occupiedData = await page.evaluate(() => {
    const worldSize = window.worldSize;
    const hfGridSize = window.hfGridSize;

    // Clear mounds
    window.mounds.length = 0;

    // Create a mock intersect
    const intersect = {
      point: new window.THREE.Vector3(0, 0.8, 0),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };

    const mound = window.createMound(intersect, false);
    const visualRadiusMeters = (mound.radius + 0.3) * (worldSize / (hfGridSize - 1));

    // Check occupancy just inside the visual radius
    const testPos = new window.THREE.Vector3(visualRadiusMeters - 0.5, 0.8, 0);
    const isOccupied = window.isAreaOccupiedByConstruction(testPos.x, testPos.z, 0.5);

    // Check occupancy just outside the visual radius
    const testPosOutside = new window.THREE.Vector3(visualRadiusMeters + 1.0, 0.8, 0);
    const isOccupiedOutside = window.isAreaOccupiedByConstruction(testPosOutside.x, testPosOutside.z, 0.5);

    return {
        visualRadiusMeters: visualRadiusMeters,
        isOccupied: isOccupied,
        isOccupiedOutside: isOccupiedOutside
    };
  });

  console.log('Occupied Data:', occupiedData);
  expect(occupiedData.isOccupied).toBe(true);
  expect(occupiedData.isOccupiedOutside).toBe(false);
});
