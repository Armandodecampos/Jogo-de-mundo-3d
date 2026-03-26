
import { test, expect } from '@playwright/test';

test('should not be able to climb a 10x10 wall of mud blocks', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/index.htm');

  // Click 'Jogar'
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true);

  // Get player position
  const initialPos = await page.evaluate(() => {
    return { x: window.playerBody.position.x, y: window.playerBody.position.y, z: window.playerBody.position.z };
  });

  // Create a 10x10 wall of mud blocks in front of the player
  // Assume player is looking towards -Z or something. Let's place it at z = initialPos.z - 2
  await page.evaluate((pos) => {
    const wallZ = pos.z - 2;
    for (let xOffset = -2; xOffset <= 2; xOffset += 0.4) {
      for (let yOffset = 0; yOffset < 4; yOffset += 0.4) {
        const p = new window.THREE.Vector3(pos.x + xOffset, 0.8 + yOffset, wallZ);
        const q = new window.CANNON.Quaternion();
        window.createPlaceableBlock(p, q, 'cob', 'cob');
      }
    }
  }, initialPos);

  // Move forward for 2 seconds
  await page.keyboard.down('w');
  await page.waitForTimeout(2000);
  await page.keyboard.up('w');

  // Check player height
  const finalPos = await page.evaluate(() => {
    return { x: window.playerBody.position.x, y: window.playerBody.position.y, z: window.playerBody.position.z };
  });

  console.log(`Initial Y: ${initialPos.y}, Final Y: ${finalPos.y}`);

  // If the player climbed, finalPos.y would be significantly higher than initialPos.y
  // A single step is 0.4m. 10x10 wall is ~4m high.
  // The climb logic applies velocity 6.0.
  expect(finalPos.y).toBeLessThan(initialPos.y + 1.0);
});
