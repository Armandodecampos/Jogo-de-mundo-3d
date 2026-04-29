import { test, expect } from '@playwright/test';

test('Capim growth interval and constraints', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  // 1. Verify capim count is initially populated
  const initialCount = await page.evaluate(() => window.capimClusters.length);
  console.log('Initial capim count:', initialCount);
  expect(initialCount).toBeGreaterThan(0);

  // 2. Control natural growth by setting target count to current count
  await page.evaluate((count) => {
      window.targetCapimCount = count;
      // Also reset growth timer to now
      window.lastCapimGrowthTime = window.world.time;
  }, initialCount);

  // 3. Remove one capim cluster
  await page.evaluate(() => {
      const cluster = window.capimClusters.pop();
      const zeroMatrix = new window.THREE.Matrix4().makeScale(0, 0, 0);
      for (let k = 0; k < 6; k++) { // assuming bladesPerCluster is 6
          const instanceIdx = cluster.poolIndex * 6 + k;
          window.capimInstancedMeshes[0].setMatrixAt(instanceIdx, zeroMatrix);
      }
      window.capimInstancedMeshes[0].instanceMatrix.needsUpdate = true;
      window.capimFreeIndices.push(cluster.poolIndex);
  });

  const countAfterRemoval = await page.evaluate(() => window.capimClusters.length);
  expect(countAfterRemoval).toBe(initialCount - 1);

  // 4. Trigger growth by adjusting target and timer
  console.log('Triggering capim growth...');
  await page.evaluate((count) => {
      window.targetCapimCount = count;
      window.lastCapimGrowthTime = window.world.time - 11; // Set back 11s to trigger growth
  }, initialCount);

  // Wait for growth to happen
  await page.waitForFunction((expectedCount) => {
      return window.capimClusters.length === expectedCount;
  }, initialCount, { timeout: 30000 });

  const countAfterGrowth = await page.evaluate(() => window.capimClusters.length);
  console.log('Count after growth:', countAfterGrowth);
  expect(countAfterGrowth).toBe(initialCount);

  // 5. Verify it doesn't grow where there's a construction
  await page.evaluate(() => {
      const pos = new window.THREE.Vector3(20, window.getSurfaceHeight(20, 20), 20);
      const body = {
          position: { x: 20, y: pos.y, z: 20 },
          userData: { type: 'floor' }
      };
      window.placedConstructionBodies.push(body);

      // Clear area near (20, 20)
      window.removeCapimNear(new window.THREE.Vector3(20, 0, 20), 5);

      // Stop growth for now
      window.targetCapimCount = window.capimClusters.length;
  });

  const countNearBefore = await page.evaluate(() => {
      const pos = new window.THREE.Vector3(20, 0, 20);
      return window.capimClusters.filter(c => window.calculateWrappedDistance(pos, c.position) < 4.0).length;
  });
  expect(countNearBefore).toBe(0);

  // Increase target count and trigger growth
  await page.evaluate(() => {
      window.targetCapimCount = window.capimClusters.length + 50;
      window.lastCapimGrowthTime = window.world.time - 11;
  });

  // Wait for some growth
  await page.waitForTimeout(2000);

  // Verify no capim grew exactly where the floor is
  const countNearAfter = await page.evaluate(() => {
      const pos = new window.THREE.Vector3(20, 0, 20);
      return window.capimClusters.filter(c => window.calculateWrappedDistance(pos, c.position) < 2.0).length;
  });
  expect(countNearAfter).toBe(0);
});
