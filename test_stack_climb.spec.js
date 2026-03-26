const { test, expect } = require('@playwright/test');
const path = require('path');

test.setTimeout(90000);

test('should correctly identify wall vs step', async ({ page }) => {
  const filePath = 'file://' + path.resolve('index.htm');
  await page.goto(filePath);
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 20000 });

  const checkClimbVelocity = async (setupFn) => {
    await page.evaluate(setupFn);
    await page.waitForTimeout(2000); // More time to stabilize

    let maxVelocityY = 0;
    await page.keyboard.down('w');
    for(let i=0; i<10; i++) { // Reduced iterations
        const vy = await page.evaluate(() => window.playerBody.velocity.y);
        if (vy > maxVelocityY) maxVelocityY = vy;
        await page.waitForTimeout(100);
    }
    await page.keyboard.up('w');
    return maxVelocityY;
  };

  // 1. Single block: Should climb
  const vSingle = await checkClimbVelocity(() => {
    window.playerBody.position.set(0, 1.67, 0);
    window.playerBody.velocity.set(0,0,0);
    window.camera.rotation.set(0, Math.PI, 0); // Z+
    window.createPlaceableBlock({ x: 0, y: 1.0, z: 0.5 }, null, 'cob');
  });
  console.log(`Max Y Velocity against single block: ${vSingle}`);
  expect(vSingle).toBeGreaterThan(1.0);

  // 2. Stacked blocks: Should NOT climb
  const vStack = await checkClimbVelocity(() => {
    window.playerBody.position.set(10, 1.67, 10);
    window.playerBody.velocity.set(0,0,0);
    window.camera.rotation.set(0, Math.PI, 0); // Z+
    window.createPlaceableBlock({ x: 10, y: 1.0, z: 10.5 }, null, 'cob');
    window.createPlaceableBlock({ x: 10, y: 1.4, z: 10.5 }, null, 'cob');
  });
  console.log(`Max Y Velocity against stacked blocks: ${vStack}`);
  expect(vStack).toBeLessThan(1.0);
});
