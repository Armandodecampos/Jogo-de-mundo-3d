import { test, expect } from '@playwright/test';

test('Capim can grow on dirt mounds', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  // 1. Create a dirt mound
  const moundPos = await page.evaluate(async () => {
    const { THREE, createMound, islandMeshes } = window;

    const dirtItemName = 'terra';
    const moundGrowthStages = [0.25, 0.5, 0.75, 1.0];

    // Simulate a hit on the terrain at (30, 0, 30)
    const pos = new THREE.Vector3(30, 0, 30);
    const intersect = {
      point: pos,
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };

    const mound = createMound(intersect, true, dirtItemName);
    mound.growthStage = moundGrowthStages.length;
    mound.height = 1.0;
    mound.lastCapimGrowthTime = window.world.time;

    window.updateIslandGeometry(mound);

    window.targetCapimCount = window.capimClusters.length + 500;
    window.lastCapimGrowthTime = -100;

    return { x: mound.position.x, z: mound.position.z };
  });

  // 2. Poll for capim to grow
  console.log('Waiting for capim growth at:', moundPos);

  for (let i = 0; i < 60; i++) {
     const found = await page.evaluate((target) => {
        const radius = 5.0;
        const islandSurfaceHeight = 0.8;

        const now = window.world.time;
        if (now - window.lastCapimGrowthTime >= 10) {
            window.respawnCapim(100);
            window.lastCapimGrowthTime = now;
        }

        return window.capimClusters.some(cluster => {
            const dx = cluster.position.x - target.x;
            const dz = cluster.position.z - target.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            return dist < radius && cluster.position.y > islandSurfaceHeight + 0.1;
        });
     }, moundPos);

     if (found) {
        console.log('Capim on mound found!');
        break;
     }

     await page.evaluate(() => {
        window.world.time += 1;
     });
     await new Promise(r => setTimeout(r, 200));
  }

  const finalCheck = await page.evaluate((target) => {
    const radius = 5.0;
    const islandSurfaceHeight = 0.8;
    return window.capimClusters.some(cluster => {
        const dx = cluster.position.x - target.x;
        const dz = cluster.position.z - target.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        return dist < radius && cluster.position.y > islandSurfaceHeight + 0.1;
    });
  }, moundPos);

  expect(finalCheck).toBe(true);
});
