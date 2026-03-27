
const { test, expect } = require('@playwright/test');
const path = require('path');

test('Verify crate stacking stability over time', async ({ page }) => {
  const filePath = `file://${path.resolve(__dirname, 'index.htm')}`;
  await page.goto(filePath);

  // Click start button
  await page.click('#startButton');

  // Wait for the game to be ready
  await page.waitForFunction(() => window.isWorldReady === true);

  // Use the helper to create two boxes stacked
  await page.evaluate(() => {
    const pos1 = new window.CANNON.Vec3(0, 5, 0);
    window.createBox(pos1, new window.CANNON.Quaternion());

    // Stack second box on top with a slight offset to test friction
    const pos2 = new window.CANNON.Vec3(0.1, 7, 0.1);
    window.createBox(pos2, new window.CANNON.Quaternion());
  });

  // Wait for physics to settle (5 seconds)
  await page.waitForTimeout(5000);

  const stackData = await page.evaluate(() => {
    return window.collectibleBoxes.map(box => ({
      x: box.body.position.x,
      y: box.body.position.y,
      z: box.body.position.z,
      vx: box.body.velocity.x,
      vz: box.body.velocity.z
    }));
  });

  console.log('Stack data after 5s:', stackData);

  // Check if they are still stacked and nearly stationary
  const box1 = stackData[0];
  const box2 = stackData[1];

  // Box 2 should be above Box 1
  expect(box2.y).toBeGreaterThan(box1.y + 0.5);

  // They should have very low horizontal velocity
  expect(Math.abs(box2.vx)).toBeLessThan(0.01);
  expect(Math.abs(box2.vz)).toBeLessThan(0.01);

  // Wait another 5 seconds to check for slow drift
  await page.waitForTimeout(5000);

  const stackDataLater = await page.evaluate(() => {
    return window.collectibleBoxes.map(box => ({
      x: box.body.position.x,
      z: box.body.position.z
    }));
  });

  console.log('Stack data after 10s:', stackDataLater);

  const driftX = Math.abs(stackDataLater[1].x - box2.x);
  const driftZ = Math.abs(stackDataLater[1].z - box2.z);

  console.log(`Drift after 5 more seconds: X=${driftX}, Z=${driftZ}`);

  // Drift should be negligible
  expect(driftX).toBeLessThan(0.01);
  expect(driftZ).toBeLessThan(0.01);
});
