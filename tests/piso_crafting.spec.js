import { test, expect } from '@playwright/test';

test('Piso de barro and Cob recipe yield and item weight verification', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // 1. Verify Piso de Barro crafting recipe result quantity is 300
  const pisoRecipe = await page.evaluate(() => {
    const recipes = window.recipes.initial;
    return recipes.find(r => r.result && r.result.name === 'piso');
  });

  expect(pisoRecipe).toBeDefined();
  expect(pisoRecipe.result.quantity).toBe(300);

  // 2. Verify Piso de Barro item weight is 0.008 kg
  const pisoWeight = await page.evaluate(() => {
    return window.itemWeights['piso'];
  });

  expect(pisoWeight).toBe(0.008);

  // 3. Verify total weight of 300 piso items equals 2.4 kg
  const totalPisoBatchWeight = pisoRecipe.result.quantity * pisoWeight;
  expect(totalPisoBatchWeight).toBeCloseTo(2.4, 4);

  // 4. Verify Cob (Bloco de Barro) crafting recipe result quantity is 100
  const cobRecipe = await page.evaluate(() => {
    const recipes = window.recipes.initial;
    return recipes.find(r => r.result && r.result.name === 'cob');
  });

  expect(cobRecipe).toBeDefined();
  expect(cobRecipe.result.quantity).toBe(100);

  // 5. Verify Cob item weight is 0.024 kg
  const cobWeight = await page.evaluate(() => {
    return window.itemWeights['cob'];
  });

  expect(cobWeight).toBe(0.024);

  // 6. Verify total weight of 100 cob items equals 2.4 kg
  const totalCobBatchWeight = cobRecipe.result.quantity * cobWeight;
  expect(totalCobBatchWeight).toBeCloseTo(2.4, 4);

  // 7. Verify floor texture URL
  const floorTextureURL = await page.evaluate(() => {
    return window.getItemIconURL ? window.getItemIconURL('piso') : null;
  });
  expect(floorTextureURL).toContain('Cob-piso.png');
});
