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

      const realIslandMesh = window.islandMeshes[0].mesh;
      const originalIntersect = window.THREE.Raycaster.prototype.intersectObjects;
      window.THREE.Raycaster.prototype.intersectObjects = function() {
        return [{
            distance: 1,
            point: new window.THREE.Vector3(10, 0, 10),
            object: realIslandMesh
        }];
      };

      const originalDistance = window.calculateWrappedDistance;
      window.calculateWrappedDistance = () => 0.1;

      // Position camera aiming directly at (10, 0, 10)
      window.camera.position.set(10, 1.6, 11);
      window.camera.lookAt(new window.THREE.Vector3(10, 0.5, 10));
      window.camera.updateMatrixWorld();
      window.camera.matrixWorldInverse.copy(window.camera.matrixWorld).invert();

      // Mutate existing capimClusters array so local scope in index.htm sees it
      const savedClusters = [...window.capimClusters];
      window.capimClusters.length = 0;
      window.capimClusters.push({ position: new window.THREE.Vector3(10, 0, 10) });

      try {
        window.startDestruction();

        const time = window.targetDestroyTime;
        window.stopDestruction();
        return time;
      } finally {
        window.THREE.Raycaster.prototype.intersectObjects = originalIntersect;
        window.calculateWrappedDistance = originalDistance;
        window.capimClusters.length = 0;
        window.capimClusters.push(...savedClusters);
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
