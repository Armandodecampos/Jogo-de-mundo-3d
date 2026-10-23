import { test, expect } from '@playwright/test';
import path from 'path';

test('Verify clay, wood, and stone blocks/floors are non-destructible', async ({ page }) => {
  const filePath = 'file://' + path.resolve('index.htm');
  await page.goto(filePath);

  await page.evaluate(() => {
    if (window.startGame) {
      window.startGame();
    }
  });

  await page.waitForTimeout(1000);

  const blockCheckResults = await page.evaluate(() => {
    const CANNON = window.CANNON;
    const THREE = window.THREE;

    const blockTypes = ['cob', 'piso', 'bloco_madeira', 'piso_madeira', 'bloco_pedra', 'piso_pedra'];
    const results = {};

    blockTypes.forEach(type => {
      window.createPlaceableBlock(new THREE.Vector3(0, 10, 0), new THREE.Quaternion(), type);
      const lastBody = window.placedConstructionBodies[window.placedConstructionBodies.length - 1];
      results[type] = {
        type: lastBody.userData.type,
        isDestructible: lastBody.userData.isDestructible,
        isCollectible: lastBody.userData.isCollectible
      };
    });

    return results;
  });

  console.log('Block check results:', blockCheckResults);

  for (const [type, data] of Object.entries(blockCheckResults)) {
    expect(data.isDestructible).toBe(false);
    expect(data.isCollectible).toBe(true);
  }

  // Verify left-click / startDestruction behavior
  const destructionTest = await page.evaluate(() => {
    // Equip a pickaxe in active belt slot
    window.beltItems[window.selectedSlotIndex] = { name: 'picareta', quantity: 1 };
    window.updateBeltDisplay();

    // Create a clay block in front
    window.createPlaceableBlock(new THREE.Vector3(0, 1, -2), new THREE.Quaternion(), 'cob');
    const cobBody = window.placedConstructionBodies[window.placedConstructionBodies.length - 1];

    // Attempt startDestruction
    window.startDestruction();

    return {
      isDestroying: window.isDestroying,
      destroyProgress: window.destroyProgress
    };
  });

  console.log('Destruction test with pickaxe on cob:', destructionTest);
  expect(destructionTest.isDestroying).toBe(false);
});
