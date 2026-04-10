const { test, expect } = require('@playwright/test');

test.describe('Weather HUD Button', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
        await page.evaluate(() => { window.gamePaused = false; });
    });

    test('HUD weather toggle button works', async ({ page }) => {
        // Check initial state
        const initialTargetRain = await page.evaluate(() => window.targetRainIntensity);
        expect(initialTargetRain).toBe(0);

        const initialHudText = await page.textContent('#hudWeatherText');
        expect(initialHudText).toBe('Sol');

        // Click HUD toggle button
        await page.evaluate(() => {
            document.getElementById('hudWeatherToggle').click();
        });

        // Verify state change
        const finalTargetRain = await page.evaluate(() => window.targetRainIntensity);
        expect(finalTargetRain).toBeGreaterThan(0);

        const finalHudText = await page.textContent('#hudWeatherText');
        expect(finalHudText).toBe('Chuva');

        // Toggle back to sun
        await page.evaluate(() => {
            document.getElementById('hudWeatherToggle').click();
        });
        const backToSunRain = await page.evaluate(() => window.targetRainIntensity);
        expect(backToSunRain).toBe(0);
        expect(await page.textContent('#hudWeatherText')).toBe('Sol');
    });

    test('Escape key releases mouse but keeps HUD visible; Pressing Escape again opens menu', async ({ page }) => {
        const hudButtons = page.locator('#hudButtons');
        await expect(hudButtons).toBeVisible();

        // Press Escape - should release mouse but NOT hide HUD (new behavior)
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.pointerLockElement === null);
        await expect(hudButtons).toBeVisible();

        // Verify menu is NOT active yet
        const optionsScreen = page.locator('#optionsScreen');
        await expect(optionsScreen).not.toHaveClass(/active/);

        // Press Escape again - should now open the menu
        await page.keyboard.press('Escape');
        await expect(optionsScreen).toHaveClass(/active/);
        await expect(hudButtons).toBeHidden();

        // Close menu
        await page.click('#resumeButton');
        await expect(hudButtons).toBeVisible();
        await expect(optionsScreen).not.toHaveClass(/active/);
    });
});
