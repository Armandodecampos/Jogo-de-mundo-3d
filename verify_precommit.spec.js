const { test, expect } = require('@playwright/test');
const path = require('path');

test('verify seamless sea and island textures', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('file://' + path.join(__dirname, 'index.htm'));
    await page.click('button:has-text("Jogar")');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

    // Enable Fly Mode
    await page.keyboard.press('v');

    // Look at a junction (e.g., X=1000)
    await page.evaluate(() => {
        window.camera.position.set(1000, 20, 500);
        window.camera.lookAt(1000, 0, 1000);
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'precommit_junction.png' });

    // Look at the island
    await page.evaluate(() => {
        window.camera.position.set(0, 50, 100);
        window.camera.lookAt(0, 0, 0);
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'precommit_island.png' });
});
