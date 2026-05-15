import { test, expect } from '@playwright/test';

test('Slope healing verification on mountain', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // 1. Create a hole at (20, 20) with elevated originalHeight
  await page.evaluate(() => {
    const intersect = {
      point: new window.THREE.Vector3(20, 5.0, 20),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };
    const m = window.createMound(intersect, false); // isPositive = false (hole)
    m.height = -1.0;
    m.maxHeightChange = -1.0;
    m.growthStage = 4;
    m.originalHeight = 5.0; // Simulated mountain height
    m.position.y = 5.0; // Match originalHeight for distance calc
    window.updateIslandGeometry(m);
  });

  // 2. Fast forward time and check healing
  await page.evaluate(() => {
    window.world.time += 35;
  });

  // Wait for animation loop
  await page.waitForTimeout(2000);

  const closingCount = await page.evaluate(() => window.closingMounds.length);
  console.log('Closing mounds count:', closingCount);
  expect(closingCount).toBe(1);

  // 3. Check if player is pushed to correct height (near 5.0)
  await page.evaluate(() => {
     window.playerBody.position.set(20, 5.0, 20);
  });

  await page.waitForTimeout(1000);

  const playerY = await page.evaluate(() => window.playerBody.position.y);
  console.log('Player Y after being pushed by healing hole on mountain:', playerY);

  // expected Y >= 5.0 + mound.height + playerRadius
  // Since healing started, mound.height is > -1.0
  expect(playerY).toBeGreaterThan(4.5);

  // 4. Complete healing
  await page.evaluate(() => {
    window.world.time += 10;
  });
  await page.waitForTimeout(1000);

  const finalMoundCount = await page.evaluate(() => window.mounds.length);
  expect(finalMoundCount).toBe(0);
});
