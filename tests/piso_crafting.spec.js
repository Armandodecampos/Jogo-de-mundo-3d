import { test, expect } from '@playwright/test';

test('Piso de barro recipe yield and item weight verification', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // 1. Verify Piso de Barro crafting recipe result quantity is 500
  const pisoRecipe = await page.evaluate(() => {
    const recipes = window.recipes.initial;
    return recipes.find(r => r.result && r.result.name === 'piso');
  });

  expect(pisoRecipe).toBeDefined();
  expect(pisoRecipe.result.quantity).toBe(500);

  // 2. Verify Piso de Barro item weight is 0.0048 kg
  const pisoWeight = await page.evaluate(() => {
    return window.itemWeights['piso'];
  });

  expect(pisoWeight).toBe(0.0048);

  // 3. Verify total weight of 500 piso items equals 2.4 kg
  const totalBatchWeight = pisoRecipe.result.quantity * pisoWeight;
  expect(totalBatchWeight).toBeCloseTo(2.4, 4);

  // 4. Verify floor texture URL
  const floorTextureURL = await page.evaluate(() => {
    return window.getItemIconURL ? window.getItemIconURL('piso') : null;
  });
  expect(floorTextureURL).toContain('Cob-piso.png');
});
