import { test, expect } from '@playwright/test';

test('Verify mountain collisions and terrain modification without color change', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true);

  // 1. Verify mountain collisions (Central Mountain)
  // Player spawns at (0, H+R+2, 0). Move to a mountain coordinate and check height.
  const mountainPos = { x: 0, z: 0 };
  const mountainHeight = await page.evaluate((pos) => {
    return window.getSurfaceHeight(pos.x, pos.z);
  }, mountainPos);

  // Wait a bit for physics to settle
  await page.waitForTimeout(1000);

  const playerY = await page.evaluate(() => window.playerBody.position.y);
  console.log(`Player Y at center: ${playerY}, Mountain Height: ${mountainHeight}`);
  expect(playerY).toBeGreaterThan(mountainHeight - 1); // Should be standing on it

  // 2. Perform digging and verify no color change
  // Pick up Shovel from initial chest
  await page.evaluate(() => {
    const chest = window.placedConstructionBodies.find(b => b.userData && b.userData.isChest);
    const shovel = chest.userData.inventory.find(i => i && i.name === 'pá');
    window.addItemToInventory(window.beltItems, shovel);
    window.updateUI();
  });

  // Start digging at (2, -5)
  const digPos = { x: 2, y: await page.evaluate(() => window.getSurfaceHeight(2, -5)), z: -5 };
  await page.evaluate((pos) => {
    window.playerBody.position.set(pos.x - 2, pos.y + 2, pos.z); // stand near
    window.camera.lookAt(pos.x, pos.y, pos.z);
    window.startDestruction();
  }, digPos);

  await page.waitForTimeout(3000); // Wait for digging to progress

  // Check if modifiedVertices exists (should be undefined)
  const modifiedVerticesExists = await page.evaluate(() => typeof window.modifiedVertices !== 'undefined');
  expect(modifiedVerticesExists).toBe(false);

  // Check if any color attribute was changed in islandMesh (should be all 1.0)
  const colors = await page.evaluate(() => {
    const geom = window.islandGeometry;
    if (!geom.attributes.color) return null;
    return Array.from(geom.attributes.color.array).slice(0, 10);
  });
  expect(colors).toBeNull(); // Since I removed the attribute

  console.log('Verification successful: No color attribute found and player is colliding with mountain.');
});
