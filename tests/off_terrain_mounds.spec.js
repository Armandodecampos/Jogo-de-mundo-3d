import { test, expect } from '@playwright/test';

test('Off-terrain mound placement verification', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // 1. Create a box to place a mound on
  await page.evaluate(() => {
    const pos = new window.THREE.Vector3(5, 5, 5);
    window.createBox(pos, new window.THREE.Quaternion());
  });

  // Wait for the box to be registered in raycastTargets
  await page.waitForFunction(() => window.collectibleBoxes.length > 0);

  // 2. Place a mound on the box
  const result = await page.evaluate(async () => {
    const box = window.collectibleBoxes[0];
    const boxBody = box.body;
    const boxMesh = box.mesh;

    // Simulate hitting the box with dirt
    window.beltItems[window.selectedSlotIndex] = { name: 'terra', quantity: 10 };

    const intersect = {
      point: new window.THREE.Vector3(boxBody.position.x, boxBody.position.y + 0.5, boxBody.position.z),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: boxMesh
    };

    // Use createMound directly to test the logic
    const mound = window.createMound(intersect, true, 'terra', true);
    return {
        moundCreated: !!mound,
        isOnObject: mound ? mound.isOnObject : false,
        moundY: mound ? mound.position.y : 0,
        boxY: boxBody.position.y
    };
  });

  expect(result.moundCreated).toBe(true);
  expect(result.isOnObject).toBe(true);
  expect(result.moundY).toBeCloseTo(result.boxY + 0.5);

  // 3. Verify that updateIslandGeometry skips this mound
  const hfChanged = await page.evaluate(() => {
      const mound = window.mounds[window.mounds.length - 1];
      mound.height = 1.0; // Simulate completed mound
      window.updateIslandGeometry();

      // Check the heightfield at the mound position
      const step = window.worldSize / (window.hfGridSize - 1);
      const mx = Math.round((mound.position.x + window.worldSize / 2) / step);
      const mz = Math.round((window.worldSize / 2 - mound.position.z) / step);

      // height should be equal to base height (0.8 usually) because isOnObject mounds are skipped
      return window.currentHfMatrix[mx][mz];
  });

  // Base island surface height is typically 0.8
  expect(hfChanged).toBeCloseTo(0.8, 1);
});
