import { test, expect } from '@playwright/test';

test('hunger decreases over time', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.waitForSelector('#startButton', { state: 'visible' });
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  const initialHunger = await page.evaluate(() => window.playerHunger);
  expect(initialHunger).toBeLessThanOrEqual(100);

  // Wait for some time to allow hunger to decay
  await page.waitForTimeout(5000);

  const hunger = await page.evaluate(() => window.playerHunger);
  expect(hunger).toBeLessThan(initialHunger);
});

test('eating food restores hunger', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.waitForSelector('#startButton', { state: 'visible' });
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // Manually set hunger low and pause decay for a moment
  await page.evaluate(() => {
    window.playerHunger = 50;
    window._originalDecay = window.hungerDecayRate;
    window.hungerDecayRate = 0;
  });

  // Give the player an apple
  await page.evaluate(() => {
    window.beltItems[1] = { name: 'maca', quantity: 1 };
    window.updateUI();
  });

  // Select the apple slot (index 1 is key '2')
  await page.keyboard.press('2');

  // Direct call to eatItem to bypass UI/event issues in test
  await page.evaluate(() => {
    window.eatItem(window.beltItems[window.selectedSlotIndex], window.selectedSlotIndex);
  });

  const hunger = await page.evaluate(() => window.playerHunger);
  expect(hunger).toBeCloseTo(70, 0);

  // Restore decay
  await page.evaluate(() => {
    window.hungerDecayRate = window._originalDecay;
  });
});

test('hunger reaching zero causes fainting', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.waitForSelector('#startButton', { state: 'visible' });
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // Manually set hunger very low and increase decay rate
  await page.evaluate(() => {
    window.playerHunger = 1;
    window.hungerDecayRate = 10;
  });

  // Wait for fainted overlay to be displayed
  await page.waitForFunction(() => {
    const overlay = document.getElementById('faintedOverlay');
    return overlay && window.getComputedStyle(overlay).display !== 'none';
  }, { timeout: 30000 });

  const isFainted = await page.evaluate(() => window.isFainted);
  expect(isFainted).toBe(true);
});
