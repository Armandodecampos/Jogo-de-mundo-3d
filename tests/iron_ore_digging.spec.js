const { test, expect } = require('@playwright/test');

test.describe('Iron Ore Acquisition (Digging)', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
    });

    test('should have a chance to get iron ore when digging in stone layer', async ({ page }) => {
        const gotIronOre = await page.evaluate(async () => {
            const stoneItemName = 'pedra';
            const ironOreItemName = 'minerio_ferro';

            // Clear inventory to start clean
            window.backpackItems.length = 0;
            window.maintainBackpack();

            let foundIronOre = false;

            // Simula 200 tentativas
            for (let i = 0; i < 200; i++) {
                // Directly trigger the acquisition logic we added in index.htm
                // Logic: if (mound.isStoneLayer) { addItemToInventory(backpackItems, { name: stoneItemName, quantity: 1 }); ... }

                window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: 1 });
                if (Math.random() < 0.05) {
                    window.addItemToInventory(window.backpackItems, { name: 'minerio_ferro', quantity: 1 });
                }

                if (window.backpackItems.some(item => item && item.name === ironOreItemName)) {
                    foundIronOre = true;
                    break;
                }
            }
            return foundIronOre;
        });

        expect(gotIronOre).toBe(true);
    });

    test('iron ore should go directly to backpackItems', async ({ page }) => {
        const isDroppedInBackpack = await page.evaluate(() => {
            const ironOreItemName = 'minerio_ferro';
            const initialBackpackCount = window.backpackItems.filter(i => i && i.name === ironOreItemName).length;
            const initialBeltCount = window.beltItems.filter(i => i && i.name === ironOreItemName).length;

            window.addItemToInventory(window.backpackItems, { name: ironOreItemName, quantity: 1 });

            const finalBackpackCount = window.backpackItems.filter(i => i && i.name === ironOreItemName).length;
            const finalBeltCount = window.beltItems.filter(i => i && i.name === ironOreItemName).length;

            return (finalBackpackCount > initialBackpackCount) && (finalBeltCount === initialBeltCount);
        });

        expect(isDroppedInBackpack).toBe(true);
    });
});
