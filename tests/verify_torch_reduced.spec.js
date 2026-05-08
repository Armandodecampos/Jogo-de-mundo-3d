const { test, expect } = require('@playwright/test');
const path = require('path');

test.setTimeout(120000); // Increased timeout

test('Verify reduced torch flame size', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  await page.evaluate(() => {
    window.beltItems[1] = { name: 'tocha', quantity: 1 };
    window.selectedSlotIndex = 1;
    window.updateUI();
  });

  await page.waitForTimeout(10000); // Wait longer for GPU to settle

  const screenshotPath = 'screenshots/torch_reduced_verify.png';
  await page.screenshot({ path: screenshotPath });

  console.log('Screenshot saved to:', screenshotPath);
});
