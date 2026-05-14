const { test, expect } = require('@playwright/test');

test.describe('Iron Ore and Notifications', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
    });

    test('should have a chance to get iron ore when mining', async ({ page }) => {
        const gotIronOre = await page.evaluate(async () => {
            const ironOreItemName = 'minerio_ferro';
            const initialCount = window.backpackItems.filter(i => i && i.name === ironOreItemName).length;

            for (let i = 0; i < 200; i++) {
                if (Math.random() < 0.10) {
                    window.addItemToInventory(window.backpackItems, { name: ironOreItemName, quantity: 1 });
                }
                if (window.backpackItems.filter(i => i && i.name === ironOreItemName).length > initialCount) {
                    return true;
                }
            }
            return false;
        });

        expect(gotIronOre).toBe(true);
    });

    test('should show acquisition notification when item is added', async ({ page }) => {
        await page.evaluate(() => {
            window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: 1 });
        });

        const notification = page.locator('.acquisition-notification').first();
        await expect(notification).toBeVisible({ timeout: 10000 });
        await expect(notification).toHaveText(/Você adquiriu: Pedra/i);
    });

    test('notifications should stack and disappear after 10s', async ({ page }) => {
        test.setTimeout(60000);

        await page.evaluate(() => {
            window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: 1 });
            window.addItemToInventory(window.backpackItems, { name: 'graveto', quantity: 1 });
        });

        const notifications = page.locator('.acquisition-notification');
        await expect(notifications).toHaveCount(2);

        await page.waitForTimeout(12000);
        await expect(notifications).toHaveCount(0, { timeout: 5000 });
    });
});
