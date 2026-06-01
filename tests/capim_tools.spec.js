import { test, expect } from '@playwright/test';

test('Capim destruction time with tools', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  const testToolTimes = async (itemName) => {
    return await page.evaluate(async (tool) => {
      // Set the held item
      if (tool) {
        window.beltItems[window.selectedSlotIndex] = { name: tool, quantity: 1 };
      } else {
        window.beltItems[window.selectedSlotIndex] = null;
      }

      window.updateUI();

      const originalIntersect = window.THREE.Raycaster.prototype.intersectObjects;
      window.THREE.Raycaster.prototype.intersectObjects = function() {
        return [{
            distance: 1,
            point: new window.THREE.Vector3(10, 0, 10),
            object: window.islandMeshes[0].mesh
        }];
      };

      const originalDistance = window.calculateWrappedDistance;
      window.calculateWrappedDistance = () => 0.1;

      // Mock capimClusters to ensure potentialCapim is set
      const originalClusters = window.capimClusters;
      window.capimClusters = [{ position: new window.THREE.Vector3(10, 0, 10) }];

      try {
        window.startDestruction();
        // Force target to be the capim if startDestruction didn't pick it
        if (!window.targetDestroyTime || window.targetDestroyTime === 15) {
             // Re-run the core logic with forced target
             const target = { isCapim: true, cluster: window.capimClusters[0] };
             window.stopDestruction();
             // Manually invoke the internal logic of startDestruction for the target
             // Since we can't easily do that, let's just use the exposed window.targetDestroyTime
             // after a manual assignment if we could, but we can't.
             // Let's try to just make potentialCapim the ONLY thing it can find.
             const oldIslandMeshes = window.islandMeshes;
             window.islandMeshes = []; // This will skip the isIslandMesh check and the potentialGround assignment
             try {
                window.startDestruction();
             } finally {
                window.islandMeshes = oldIslandMeshes;
             }
        }

        const time = window.targetDestroyTime;
        window.stopDestruction();
        return time;
      } finally {
        window.THREE.Raycaster.prototype.intersectObjects = originalIntersect;
        window.calculateWrappedDistance = originalDistance;
        window.capimClusters = originalClusters;
      }
    }, itemName);
  };

  const handTime = await testToolTimes(null);
  console.log(`Hand destruction time: ${handTime}`);

  const stoneAxeTime = await testToolTimes('machado');
  console.log(`Stone Axe destruction time: ${stoneAxeTime}`);

  const ironAxeTime = await testToolTimes('machado_ferro');
  console.log(`Iron Axe destruction time: ${ironAxeTime}`);

  expect(handTime).toBeCloseTo(2.0, 5);
  expect(stoneAxeTime).toBeCloseTo(0.06, 5);
  expect(ironAxeTime).toBeCloseTo(0.03, 5);
});
