const { test, expect } = require('@playwright/test');
const path = require('path');

test.setTimeout(60000);

test('crates should be stackable and not slide off', async ({ page }) => {
  const filePath = 'file://' + path.resolve('index.htm');
  await page.goto(filePath);
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 20000 });

  await page.evaluate(() => {
    // Clear existing boxes if any to have a clean slate
    window.collectibleBoxes.forEach(box => {
        window.world.removeBody(box.body);
        window.scene.remove(box.mesh);
    });
    window.collectibleBoxes.length = 0;

    // Create first box at origin
    window.createBox(new CANNON.Vec3(0, 5, 0));

    // Create second box slightly above with an offset
    window.createBox(new CANNON.Vec3(0.2, 7, 0.2));
  });

  // Wait for them to settle
  await page.waitForTimeout(10000);

  const boxPositions = await page.evaluate(() => {
    return window.collectibleBoxes.map(box => ({
        x: box.body.position.x,
        y: box.body.position.y,
        z: box.body.position.z,
        v: Math.sqrt(Math.pow(box.body.velocity.x, 2) + Math.pow(box.body.velocity.y, 2) + Math.pow(box.body.velocity.z, 2))
    }));
  });

  console.log('Box positions:', boxPositions);

  const dist01 = Math.sqrt(Math.pow(boxPositions[0].x - boxPositions[1].x, 2) + Math.pow(boxPositions[0].z - boxPositions[1].z, 2));
  console.log('Horizontal distance between boxes:', dist01);

  // We expect them to be stacked, so distance should be small.
  // If friction is 0, they should eventually slide off if they haven't slept yet or if gravity/physics steps cause slight movements.
  // Actually, CANNON with 0 friction and slight offset should result in sliding.

  expect(dist01).toBeLessThan(0.5);
});
