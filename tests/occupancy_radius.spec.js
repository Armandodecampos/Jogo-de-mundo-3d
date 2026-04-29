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
    const worldStep = worldSize / hfGridSize;
    const moundWorldRadius = (mound.radius + 0.5) * worldStep;

    // Check occupancy just inside the moundWorldRadius
    // Note: isAreaOccupiedByConstruction also adds its own 'radius' argument to the check
    const testPos = new window.THREE.Vector3(moundWorldRadius - 0.1, 0.8, 0);
    const isOccupied = window.isAreaOccupiedByConstruction(testPos.x, testPos.z, 0.1);

    // Check occupancy just outside the moundWorldRadius
    const testPosOutside = new window.THREE.Vector3(moundWorldRadius + 0.5, 0.8, 0);
    const isOccupiedOutside = window.isAreaOccupiedByConstruction(testPosOutside.x, testPosOutside.z, 0.1);

    return {
        moundWorldRadius: moundWorldRadius,
        isOccupied: isOccupied,
        isOccupiedOutside: isOccupiedOutside
    };
  });

  console.log('Occupied Data:', occupiedData);
  expect(occupiedData.isOccupied).toBe(true);
  expect(occupiedData.isOccupiedOutside).toBe(false);
});
