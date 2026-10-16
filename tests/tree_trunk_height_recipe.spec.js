import { test, expect } from '@playwright/test';

test('Tree trunk height and wooden block crafting recipe verification', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // 1. Verify bloco_madeira workbench recipe result quantity is 3
  const blocoMadeiraRecipe = await page.evaluate(() => {
    const recipes = window.recipes.workbench;
    return recipes.find(r => r.result && r.result.name === 'bloco_madeira');
  });

  expect(blocoMadeiraRecipe).toBeDefined();
  expect(blocoMadeiraRecipe.result.quantity).toBe(3);
  expect(blocoMadeiraRecipe.ingredients).toEqual([{ name: 'tronco_arvore', quantity: 1 }]);

  // 2. Verify tree trunk placeable block height is equal to 3 blocks height (1.2m)
  const trunkDimensions = await page.evaluate(() => {
    const pos = new window.THREE.Vector3(0, 5, 0);
    const quat = new window.THREE.Quaternion();
    window.createPlaceableBlock(pos, quat, 'tronco_arvore');
    const trunkBody = window.placedConstructionBodies.find(b => b.userData && b.userData.type === 'tronco_arvore');
    return trunkBody ? trunkBody.userData.dimensions : null;
  });

  expect(trunkDimensions).toBeDefined();
  expect(trunkDimensions.height).toBeCloseTo(1.2, 4);
});
