import { test, expect } from '@playwright/test';

test('Jangada recipe requires 10 tronco_arvore, 5 corda, and 5 tecido', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // Verify raft crafting recipe in initial recipes
  const raftRecipe = await page.evaluate(() => {
    const recipes = window.recipes.initial;
    return recipes.find(r => r.result && r.result.name === 'jangada');
  });

  expect(raftRecipe).toBeDefined();
  expect(raftRecipe.ingredients).toEqual([
    { name: 'tronco_arvore', quantity: 10 },
    { name: 'corda', quantity: 5 },
    { name: 'tecido', quantity: 5 }
  ]);
});
