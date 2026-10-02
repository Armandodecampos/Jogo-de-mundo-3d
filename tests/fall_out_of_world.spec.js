import { test, expect } from '@playwright/test';

test('player faints when falling below scenario bedrock limit', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.waitForSelector('#startButton', { state: 'visible' });
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  const initialFainted = await page.evaluate(() => window.isFainted);
  expect(initialFainted).toBe(false);

  // Teleport player below scenario bedrock limit
  await page.evaluate(() => {
    if (window.playerBody) {
      window.playerBody.position.y = window.bedrockLevel - 10;
    }
  });

  // Wait for fainted overlay to be displayed
  await page.waitForFunction(() => {
    const overlay = document.getElementById('faintedOverlay');
    return overlay && window.getComputedStyle(overlay).display !== 'none';
  }, { timeout: 30000 });

  const isFainted = await page.evaluate(() => window.isFainted);
  expect(isFainted).toBe(true);
});
