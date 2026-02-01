
import { test, expect } from '@playwright/test';

test('verify mountains are smaller', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');

  // Start the game
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 10000 });

  // Check central mountain height and radius in baseMatrix
  const mountainData = await page.evaluate(() => {
    const gridSize = 128;
    const worldSize = 1200;
    // The central mountain is at (0,0) in world coords
    // Map world (0,0) to matrix indices
    // x = (i / (gridSize - 1) - 0.5) * worldSize  => i = (x/worldSize + 0.5) * (gridSize - 1)
    // z = (0.5 - j / (gridSize - 1)) * worldSize  => j = (0.5 - z/worldSize) * (gridSize - 1)
    const i_center = Math.round(0.5 * (gridSize - 1));
    const j_center = Math.round(0.5 * (gridSize - 1));

    const centerHeight = window.baseMatrix[i_center][j_center];

    // Check height at distance 30 (should be plateau or near peak)
    const i_offset = Math.round((30/worldSize + 0.5) * (gridSize - 1));
    const offCenterHeight = window.baseMatrix[i_offset][j_center];

    return { centerHeight, offCenterHeight };
  });

  console.log('Mountain Data:', mountainData);

  // Original height was 40, doubled was 80, now should be 25 (plus islandSurfaceHeight 0.8)
  expect(mountainData.centerHeight).toBeCloseTo(25.8, 1);

  // Take a screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'mountains_smaller.png' });
});
