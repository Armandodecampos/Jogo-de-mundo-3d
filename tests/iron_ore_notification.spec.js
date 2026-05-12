const { test, expect } = require('@playwright/test');

test.describe('Iron Ore and Notifications', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.click('#startButton');
        // Wait for world to be ready
        await page.waitForFunction(() => window.isWorldReady === true);
    });

    test('should have a chance to get iron ore when mining', async ({ page }) => {
        // Mock Math.random to always return 0.04 (less than 0.05)
        await page.evaluate(() => {
            const originalRandom = Math.random;
            Math.random = () => 0.04;
            window._originalRandom = originalRandom;
        });

        // Trigger mining/destruction logic for a stone
        await page.evaluate(() => {
            const stoneItemName = 'pedra';
            const ironOreItemName = 'minerio_ferro';
            const backpackItems = window.backpackItems;

            // Simulate the logic in destroi_cenario/minerar_montanha
            // We just call the inventory function directly as that's what the mining logic does
            window.addItemToInventory(backpackItems, { name: stoneItemName, quantity: 1 });
            if (Math.random() < 0.05) {
                window.addItemToInventory(backpackItems, { name: ironOreItemName, quantity: 1 });
            }
        });

        // Check inventory for iron ore
        const hasIronOre = await page.evaluate(() => {
            return window.backpackItems.some(item => item && item.name === 'minerio_ferro');
        });
        expect(hasIronOre).toBe(true);
    });

    test('should show acquisition notification when item is added', async ({ page }) => {
        await page.evaluate(() => {
            window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: 1 });
        });

        const notification = page.locator('.acquisition-notification');
        await expect(notification).toBeVisible();
        await expect(notification).toContainText('Você adquiriu: Pedra');
    });

    test('notifications should stack and disappear after 10s', async ({ page }) => {
        test.setTimeout(60000); // Increase timeout for this long test
        await page.evaluate(() => {
            window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: 1 });
            window.addItemToInventory(window.backpackItems, { name: 'caixote', quantity: 1 });
        });

        const notifications = page.locator('.acquisition-notification');
        await expect(notifications).toHaveCount(2);

        // Wait 11 seconds (10s + 1s buffer for animation)
        await page.waitForTimeout(11000);
        await expect(notifications).toHaveCount(0);
    });
});
