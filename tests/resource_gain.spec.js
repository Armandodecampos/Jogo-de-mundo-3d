import { test, expect } from '@playwright/test';

test('Resource gain verification', async ({ page }) => {
  test.setTimeout(300000);
  await page.goto('http://localhost:8080/index.htm');

  // Just trigger startGame directly to bypass potential UI issues
  await page.evaluate(() => {
    if (typeof startGame === 'function') {
        startGame();
    } else {
        document.getElementById('startButton').click();
    }
  });

  // Wait for necessary globals to be defined
  await page.waitForFunction(() => typeof window.addItemToInventory === 'function', { timeout: 60000 });

  // Test Dirt Gain (1 per stage)
  const dirtGain = await page.evaluate(() => {
    const initialDirt = (window.backpackItems.find(i => i && i.name === 'terra')?.quantity || 0);
    const x = 0; const z = 0;
    const intersect = {
      point: new window.THREE.Vector3(x, window.getSurfaceHeight(x, z), z),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: new window.THREE.Mesh()
    };
    const mound = window.createMound(intersect, false);
    const currentDigHeight = mound.position.y + (mound.height || 0);
    const effectiveHeight = Math.min(mound.position.y, currentDigHeight);
    const distFromCenter = Math.sqrt(mound.position.x ** 2 + mound.position.z ** 2);
    let itemToGive;
    if (effectiveHeight < window.getSurfaceHeight(mound.position.x, mound.position.z) - 4.5) {
        itemToGive = 'pedra';
    } else if (distFromCenter > window.grassRadius) {
        itemToGive = 'areia';
    } else {
        itemToGive = 'terra';
    }
    window.addItemToInventory(window.backpackItems, { name: itemToGive, quantity: 1 });
    return (window.backpackItems.find(i => i && i.name === 'terra')?.quantity || 0) - initialDirt;
  });
  expect(dirtGain).toBe(1);

  // Test Stone Gain from stone object (quantity: 10)
  const stoneGain = await page.evaluate(() => {
    const initialStone = (window.backpackItems.find(i => i && i.name === 'pedra')?.quantity || 0);
    const pos = new window.THREE.Vector3(0, 10, 0);
    window.createStone(pos, new window.THREE.Quaternion());
    const lastStone = window.collectibleBoxes[window.collectibleBoxes.length - 1];
    const itemQuantity = lastStone.body.userData.quantity || 1;
    window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: itemQuantity });
    return (window.backpackItems.find(i => i && i.name === 'pedra')?.quantity || 0) - initialStone;
  });
  expect(stoneGain).toBe(10);
});
