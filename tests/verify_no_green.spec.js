const { test, expect } = require('@playwright/test');

test('Verify mountain collisions and terrain modification without color change', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true);

  // 1. Verify mountain collisions
  const mountainHeight = await page.evaluate(() => window.getSurfaceHeight(0, 0));
  await page.waitForTimeout(2000); // Allow physics to settle
  const playerY = await page.evaluate(() => window.playerBody.position.y);
  console.log(`Player Y: ${playerY}, Mountain Height: ${mountainHeight}`);
  // Player half-height is 0.87. So Y should be around mountainHeight + 0.87
  expect(playerY).toBeGreaterThan(mountainHeight);

  // 2. Verify color attribute is gone
  const hasColorAttr = await page.evaluate(() => {
    return !!window.islandGeometry.attributes.color;
  });
  expect(hasColorAttr).toBe(false);

  // 3. Verify digging still works (height changes)
  const initialHeight = await page.evaluate(() => window.getSurfaceHeight(2, -5));
  await page.evaluate(() => {
    const chest = window.placedConstructionBodies.find(b => b.userData && b.userData.isChest);
    const shovel = chest.userData.inventory.find(i => i && i.name === 'pá');
    window.beltItems[0] = { ...shovel }; // Put in slot 0
    window.selectedSlotIndex = 0;
    window.updateUI();

    window.playerBody.position.set(0, 5, -5);
    window.camera.position.set(0, 6, -5);
    window.camera.lookAt(2, window.getSurfaceHeight(2, -5), -5);
    window.startDestruction();
  });

  await page.waitForTimeout(4000); // Wait for digging

  const finalHeight = await page.evaluate(() => window.getSurfaceHeight(2, -5));
  console.log(`Initial: ${initialHeight}, Final: ${finalHeight}`);
  expect(finalHeight).toBeLessThan(initialHeight);

  console.log('Test passed: No green color and digging still works.');
});
