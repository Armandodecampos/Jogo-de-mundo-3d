import { test, expect } from '@playwright/test';

test('Grass can grow on dirt mounds', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  // 1. Create a dirt mound
  await page.evaluate(async () => {
    const { THREE, createMound, islandMeshes } = window;

    // Explicitly using constants that might not be exposed on window
    const dirtItemName = 'terra';
    const moundGrowthStages = [0.25, 0.5, 0.75, 1.0];

    // Simulate a hit on the terrain at (10, 0, 10)
    const pos = new THREE.Vector3(10, 0, 10);
    const intersect = {
      point: pos,
      face: { normal: new THREE.Vector3(0, 1, 0) },
      object: islandMeshes[0].mesh
    };

    const mound = createMound(intersect, true, dirtItemName);
    // Force the mound to complete immediately
    mound.growthStage = moundGrowthStages.length;
    mound.height = 1.0;
    mound.lastDugAt = window.world.time;

    window.updateIslandGeometry(mound);

    // Set target capim count to a large number to trigger growth
    window.targetCapimCount = window.capimClusters.length + 500;
    // Set last growth time to far in the past to trigger immediately
    window.lastGrassGrowthTime = -100;

    console.log('Mound created at:', mound.position);
  });

  // 2. Poll for grass to grow
  console.log('Waiting for grass growth...');

  // Custom polling to trigger growth manually if needed (though the interval in code should handle it)
  for (let i = 0; i < 20; i++) {
     const found = await page.evaluate(() => {
        const targetPos = { x: 10, z: 10 };
        const radius = 3.0;
        const islandSurfaceHeight = 0.8;

        // Manually trigger growth check if time has passed
        const now = window.world.time;
        if (now - window.lastGrassGrowthTime >= 10) {
            // Amount to spawn logic from code
            const currentCount = window.capimClusters.length;
            const targetCount = window.targetCapimCount;
            if (currentCount < targetCount) {
                window.respawnCapim(20);
                window.lastGrassGrowthTime = now;
            }
        }

        return window.capimClusters.some(cluster => {
            const dx = cluster.position.x - targetPos.x;
            const dz = cluster.position.z - targetPos.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            return dist < radius && cluster.position.y > islandSurfaceHeight + 0.1;
        });
     });

     if (found) {
        console.log('Grass on mound found!');
        break;
     }

     // Advance time in evaluate
     await page.evaluate(() => {
        window.world.time += 1; // Advance 1 second
     });
     await new Promise(r => setTimeout(r, 1000));
  }

  const finalCheck = await page.evaluate(() => {
    const targetPos = { x: 10, z: 10 };
    const radius = 3.0;
    const islandSurfaceHeight = 0.8;
    return window.capimClusters.some(cluster => {
        const dx = cluster.position.x - targetPos.x;
        const dz = cluster.position.z - targetPos.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        return dist < radius && cluster.position.y > islandSurfaceHeight + 0.1;
    });
  });

  expect(finalCheck).toBe(true);
});
