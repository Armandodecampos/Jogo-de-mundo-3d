import { test, expect } from '@playwright/test';

test('Tree trunk interaction hints, options modal removal, and destruction prevention', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  // Launch game
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  // Verify tree trunk isDestructible property and options modal behavior
  const initialInfo = await page.evaluate(() => {
    const x = 5, z = 5;
    const h = window.getSurfaceHeight(x, z);
    const pos = new window.CANNON.Vec3(x, h + 0.6, z);
    const quat = new window.CANNON.Quaternion();
    const trunk = window.createPlaceableBlock(pos, quat, window.treeTrunkItemName);

    return {
      isDestructible: trunk.userData.isDestructible,
      type: trunk.userData.type
    };
  });

  expect(initialInfo.isDestructible).toBe(false);

  // Test opening options menu on trunk
  await page.evaluate(() => {
    const trunk = window.placedConstructionBodies.find(b => b.userData && b.userData.type === window.treeTrunkItemName);
    window.openChestOptionsMenu(trunk);
  });

  const storeBtnText = await page.$eval('#chestOptionsStoreButton', el => el.textContent.trim());
  const isRotateHidden = await page.$eval('#chestOptionsRotateButton', el => el.classList.contains('hidden'));

  console.log('Store button text:', storeBtnText);
  console.log('Is rotate hidden:', isRotateHidden);

  expect(storeBtnText).toBe('Remover');
  expect(isRotateHidden).toBe(true);

  // Initial backpack count
  const initialBackpackCount = await page.evaluate(() => {
    return window.backpackItems.reduce((acc, item) => acc + (item ? item.quantity : 0), 0);
  });

  // Click store/remove button
  await page.click('#chestOptionsStoreButton');

  // Verify trunk was removed from world and no item was given to backpack
  const postRemovalStatus = await page.evaluate(() => {
    const trunkExists = window.placedConstructionBodies.some(b => b.userData && b.userData.type === window.treeTrunkItemName);
    const backpackCount = window.backpackItems.reduce((acc, item) => acc + (item ? item.quantity : 0), 0);
    return { trunkExists, backpackCount };
  });

  console.log('Post removal status:', postRemovalStatus);
  expect(postRemovalStatus.trunkExists).toBe(false);
  expect(postRemovalStatus.backpackCount).toBe(initialBackpackCount);
});
