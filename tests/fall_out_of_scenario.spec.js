import { test, expect } from '@playwright/test';

test('falling out of scenario causes fainting', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.waitForSelector('#startButton', { state: 'visible' });
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // Move player below scenario boundary (y = -50)
  await page.evaluate(() => {
    window.playerBody.position.y = -50;
  });

  // Wait for fainted overlay to be displayed and window.isFainted to be true
  await page.waitForFunction(() => {
    const overlay = document.getElementById('faintedOverlay');
    return overlay && window.getComputedStyle(overlay).display !== 'none' && window.isFainted === true;
  }, { timeout: 10000 });

  const isFainted = await page.evaluate(() => window.isFainted);
  expect(isFainted).toBe(true);

  // Test respawn restores player position and status
  await page.evaluate(() => {
    window.respawnPlayer();
  });

  const playerPosY = await page.evaluate(() => window.playerBody.position.y);
  const isFaintedAfterRespawn = await page.evaluate(() => window.isFainted);

  expect(playerPosY).toBeGreaterThan(0);
  expect(isFaintedAfterRespawn).toBe(false);
});
