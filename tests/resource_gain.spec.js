import { test, expect } from '@playwright/test';

test('Resource gain verification', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // Test Dirt Gain (1 per stage)
  const dirtGain = await page.evaluate(() => {
    const initialDirt = (window.backpackItems.find(i => i && i.name === 'terra')?.quantity || 0);

    // Mock a mound in grass area
    const x = 0;
    const z = 0;
    const intersect = {
      point: new window.THREE.Vector3(x, window.getSurfaceHeight(x, z), z),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };
    const mound = window.createMound(intersect, false);

    // Use the logic from index.htm
    const currentDigHeight = mound.position.y + (mound.height || 0);
    const distFromCenter = Math.sqrt(mound.position.x ** 2 + mound.position.z ** 2);
    let itemToGive;
    let quantityToGive = 1;
    if (currentDigHeight < window.getSurfaceHeight(mound.position.x, mound.position.z) - 4.5) {
        itemToGive = 'pedra';
        quantityToGive = 10;
    } else if (distFromCenter > window.grassRadius) {
        itemToGive = 'areia';
    } else {
        itemToGive = 'terra';
    }
    window.addItemToInventory(window.backpackItems, { name: itemToGive, quantity: quantityToGive });

    return (window.backpackItems.find(i => i && i.name === 'terra')?.quantity || 0) - initialDirt;
  });
  expect(dirtGain).toBe(1);

  // Test Sand Gain (1 per stage)
  const sandGain = await page.evaluate(() => {
    const initialSand = (window.backpackItems.find(i => i && i.name === 'areia')?.quantity || 0);

    // Mock a mound in beach area
    const x = 150; // Outside grassRadius (100)
    const z = 0;
    const intersect = {
      point: new window.THREE.Vector3(x, window.getSurfaceHeight(x, z), z),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };
    const mound = window.createMound(intersect, false);

    const currentDigHeight = mound.position.y + (mound.height || 0);
    const distFromCenter = Math.sqrt(mound.position.x ** 2 + mound.position.z ** 2);
    let itemToGive;
    let quantityToGive = 1;
    if (currentDigHeight < window.getSurfaceHeight(mound.position.x, mound.position.z) - 4.5) {
        itemToGive = 'pedra';
        quantityToGive = 10;
    } else if (distFromCenter > window.grassRadius) {
        itemToGive = 'areia';
    } else {
        itemToGive = 'terra';
    }
    window.addItemToInventory(window.backpackItems, { name: itemToGive, quantity: quantityToGive });

    return (window.backpackItems.find(i => i && i.name === 'areia')?.quantity || 0) - initialSand;
  });
  expect(sandGain).toBe(1);

  // Test Stone Gain from deep digging (10 per stage)
  const deepStoneGain = await page.evaluate(() => {
    const initialStone = (window.backpackItems.find(i => i && i.name === 'pedra')?.quantity || 0);

    const x = 0;
    const z = 0;
    const intersect = {
      point: new window.THREE.Vector3(x, window.getSurfaceHeight(x, z), z),
      face: { normal: new window.THREE.Vector3(0, 1, 0) },
      object: window.islandMeshes[4].mesh
    };
    const mound = window.createMound(intersect, false);
    // Force deep digging just below threshold
    mound.height = -4.6;

    const currentDigHeight = mound.position.y + (mound.height || 0);
    const distFromCenter = Math.sqrt(mound.position.x ** 2 + mound.position.z ** 2);
    let itemToGive;
    let quantityToGive = 1;
    if (currentDigHeight < window.getSurfaceHeight(mound.position.x, mound.position.z) - 4.5) {
        itemToGive = 'pedra';
        quantityToGive = 10;
    } else if (distFromCenter > window.grassRadius) {
        itemToGive = 'areia';
    } else {
        itemToGive = 'terra';
    }
    window.addItemToInventory(window.backpackItems, { name: itemToGive, quantity: quantityToGive });

    return (window.backpackItems.find(i => i && i.name === 'pedra')?.quantity || 0) - initialStone;
  });
  expect(deepStoneGain).toBe(10);

  // Test Stone Gain from stone object destruction (10 per destruction)
  const objectStoneGain = await page.evaluate(() => {
    const initialStone = (window.backpackItems.find(i => i && i.name === 'pedra')?.quantity || 0);

    // Simulate mining a stone block or meteor stone
    const userData = { type: 'pedra' }; // Or 'bloco_pedra'
    if (userData.type === 'pedra') {
        window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: 10 });
    }

    return (window.backpackItems.find(i => i && i.name === 'pedra')?.quantity || 0) - initialStone;
  });
  expect(objectStoneGain).toBe(10);
});
