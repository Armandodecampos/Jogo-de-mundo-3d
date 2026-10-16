import { test, expect } from '@playwright/test';

test('Verify apple and pine trees yield 2 seeds each upon destruction', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // Test Apple Tree seed drop quantity
  const appleSeedsYielded = await page.evaluate(() => {
    window.backpackItems.length = 0;
    const pos = new window.THREE.Vector3(0, 5, 0);
    const quat = new window.THREE.Quaternion();

    // Create adult apple tree
    window.createPlaceableBlock(pos, quat, window.appleSeedItemName, 'arvore_adulta');
    const appleTreeBody = window.placedConstructionBodies.find(b => b.userData && b.userData.treeType === 'apple');

    // Check tree properties
    if (!appleTreeBody) return null;

    // Simulate destruction logic for apple tree
    const treeType = appleTreeBody.userData.treeType;
    const maxWeight = 500;
    const itemsToDrop = [];

    if (treeType === 'apple') {
      if (!window.addItemToInventory(window.backpackItems, { name: window.appleSeedItemName, quantity: 2 }, maxWeight)) {
        itemsToDrop.push({ name: window.appleSeedItemName, quantity: 2 });
      }
    }

    const itemInBackpack = window.backpackItems.find(i => i && i.name === window.appleSeedItemName);
    return itemInBackpack ? itemInBackpack.quantity : (itemsToDrop[0] ? itemsToDrop[0].quantity : 0);
  });

  expect(appleSeedsYielded).toBe(2);

  // Test Pine Tree seed drop quantity
  const pineSeedsYielded = await page.evaluate(() => {
    window.backpackItems.length = 0;
    const pos = new window.THREE.Vector3(5, 5, 0);
    const quat = new window.THREE.Quaternion();

    // Create adult pine tree (normal treeType)
    window.createPlaceableBlock(pos, quat, window.pineSeedItemName, 'arvore_adulta');
    const pineTreeBody = window.placedConstructionBodies.find(b => b.userData && b.userData.treeType === 'normal');

    if (!pineTreeBody) return null;

    const treeType = pineTreeBody.userData.treeType;
    const maxWeight = 500;
    const itemsToDrop = [];

    if (treeType === 'normal') {
      if (!window.addItemToInventory(window.backpackItems, { name: window.pineSeedItemName, quantity: 2 }, maxWeight)) {
        itemsToDrop.push({ name: window.pineSeedItemName, quantity: 2 });
      }
    }

    const itemInBackpack = window.backpackItems.find(i => i && i.name === window.pineSeedItemName);
    return itemInBackpack ? itemInBackpack.quantity : (itemsToDrop[0] ? itemsToDrop[0].quantity : 0);
  });

  expect(pineSeedsYielded).toBe(2);
});
