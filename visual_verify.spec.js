const { test, expect } = require('@playwright/test');

test('verify shadow artifact is gone', async ({ page }) => {
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    // Set max distance to be sure
    await page.evaluate(() => {
        const slider = document.getElementById('renderDistanceSlider');
        slider.value = 2000;
        slider.dispatchEvent(new Event('input'));
    });

    // Wait for shadow and texture updates
    await page.waitForTimeout(2000);

    // Position camera to look at the sea
    await page.evaluate(() => {
        window.camera.rotation.set(-0.2, 0, 0);
    });
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'verification_final_updated.png' });
});
