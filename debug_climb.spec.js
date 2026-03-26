
import { test, expect } from '@playwright/test';

test('debug climb', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/index.htm');
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true);

  // Wait for player to land
  await page.waitForTimeout(2000);

  const initialPos = await page.evaluate(() => {
    return { x: window.playerBody.position.x, y: window.playerBody.position.y, z: window.playerBody.position.z };
  });

  // Create 10x10 wall
  await page.evaluate((pos) => {
    const wallZ = pos.z - 2; // Closer
    for (let xOffset = -2; xOffset <= 2; xOffset += 0.4) {
      for (let yOffset = 0; yOffset < 4; yOffset += 0.4) {
        const p = new window.THREE.Vector3(pos.x + xOffset, 0.8 + yOffset, wallZ);
        const q = new window.CANNON.Quaternion();
        window.createPlaceableBlock(p, q, 'cob', 'cob');
      }
    }
  }, initialPos);

  // Move to the wall
  await page.keyboard.down('w');

  // Monitor height
  let maxH = initialPos.y;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(100);
    const h = await page.evaluate(() => window.playerBody.position.y);
    if (h > maxH) maxH = h;
  }
  await page.keyboard.up('w');

  console.log(`Initial height: ${initialPos.y}`);
  console.log(`Max height reached: ${maxH}`);
  await page.screenshot({ path: 'climb_debug.png' });
});
