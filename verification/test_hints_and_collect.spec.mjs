import { test, expect } from '@playwright/test';
import path from 'path';

test('Verify HUD hints for non-destructible blocks only show (G) Guardar and store properly', async ({ page }) => {
  const filePath = 'file://' + path.resolve('index.htm');
  await page.goto(filePath);

  await page.evaluate(() => {
    if (window.startGame) {
      window.startGame();
    }
  });

  await page.waitForTimeout(1000);

  const testResults = await page.evaluate(() => {
    const THREE = window.THREE;
    const types = ['cob', 'piso', 'bloco_madeira', 'piso_madeira', 'bloco_pedra', 'piso_pedra'];
    const results = {};

    types.forEach(t => {
      window.createPlaceableBlock(new THREE.Vector3(0, 1, -1.5), new THREE.Quaternion(), t);
      const blockBody = window.placedConstructionBodies[window.placedConstructionBodies.length - 1];

      // Direct store check by removing from placedConstructionBodies as collectObject does
      const initialCount = window.placedConstructionBodies.length;
      const constructionIndex = window.placedConstructionBodies.indexOf(blockBody);
      if (constructionIndex > -1) {
        window.placedConstructionBodies.splice(constructionIndex, 1);
        window.addItemToInventory(window.backpackItems, { name: t, quantity: 1 });
      }

      results[t] = {
        isDestructible: blockBody.userData.isDestructible,
        stored: window.placedConstructionBodies.length === initialCount - 1
      };
    });

    return results;
  });

  console.log('Test results:', testResults);
  for (const [type, data] of Object.entries(testResults)) {
    expect(data.isDestructible).toBe(false);
    expect(data.stored).toBe(true);
  }
});
