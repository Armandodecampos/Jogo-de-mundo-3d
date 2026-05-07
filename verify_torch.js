const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  // Wait for world ready
  await page.waitForFunction(() => window.isWorldReady === true);

  // Equip torch
  await page.evaluate(() => {
    // Put torch in slot 1 (index 1)
    window.beltItems[1] = { name: 'tocha', quantity: 1 };
    window.selectedSlotIndex = 1;
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/torch_held_visual.png' });

  // Place torch
  await page.evaluate(() => {
    const pos = { x: 2, y: 1, z: -2 };
    window.createPlaceableBlock(pos, null, 'tocha');
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/torch_placed_visual.png' });

  await browser.close();
})();
