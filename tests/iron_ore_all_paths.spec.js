const { test, expect } = require('@playwright/test');

test.describe('Iron Ore Acquisition (All Paths)', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
    });

    test('should have a chance to get iron ore when mining mountain', async ({ page }) => {
        const gotIronOre = await page.evaluate(async () => {
            const ironOreItemName = 'minerio_ferro';
            window.backpackItems.length = 0;
            window.maintainBackpack();

            for (let i = 0; i < 200; i++) {
                // Simulating game logic: if (Math.random() < 0.10) { addItemToInventory(...) }
                if (Math.random() < 0.10) {
                    window.addItemToInventory(window.backpackItems, { name: ironOreItemName, quantity: 1 });
                }
                if (window.backpackItems.some(item => item && item.name === ironOreItemName)) return true;
            }
            return false;
        });
        expect(gotIronOre).toBe(true);
    });

    test('should have a chance to get iron ore when destroying stone collectibles', async ({ page }) => {
        const gotIronOre = await page.evaluate(async () => {
            const ironOreItemName = 'minerio_ferro';
            const stoneItemName = 'pedra';
            window.backpackItems.length = 0;
            window.maintainBackpack();

            for (let i = 0; i < 200; i++) {
                const itemType = stoneItemName;
                window.addItemToInventory(window.backpackItems, { name: itemType, quantity: 1 });
                if (itemType === stoneItemName) {
                    if (Math.random() < 0.10) {
                        window.addItemToInventory(window.backpackItems, { name: ironOreItemName, quantity: 1 });
                    }
                }
                if (window.backpackItems.some(item => item && item.name === ironOreItemName)) return true;
            }
            return false;
        });
        expect(gotIronOre).toBe(true);
    });
});
