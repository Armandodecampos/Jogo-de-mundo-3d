const { test, expect } = require('@playwright/test');

test.describe('Box Chest Functionality', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });
    });

    test('No initial box chest exists in the world on new game start', async ({ page }) => {
        const initialBoxChestCount = await page.evaluate(() => {
            return window.collectibleBoxes.filter(b => b.body.userData && b.body.userData.type === 'caixote').length;
        });

        expect(initialBoxChestCount).toBe(0);
    });

    test('Non-empty box cannot be collected', async ({ page }) => {
        const collectionResult = await page.evaluate(async () => {
            // Create a non-empty box
            const pos = new window.CANNON.Vec3(0, 5, -5);
            const boxBody = window.createBox(pos, null);
            const box = window.collectibleBoxes.find(b => b.body === boxBody);

            window.addItemToInventory(boxBody.userData.inventory, { name: 'pedra', quantity: 1 }, boxBody.userData.maxWeight, true);

            // Move player near box
            window.playerBody.position.set(0, 7, -3);

            const initialBackpackCount = window.backpackItems.filter(i => i !== null).length;

            // Mock raycaster hit for collectObject
            const originalRaycast = window.raycaster.intersectObjects;
            window.raycaster.intersectObjects = () => [{
                distance: 1,
                object: box.mesh
            }];

            window.collectObject();

            window.raycaster.intersectObjects = originalRaycast; // restore

            const finalBackpackCount = window.backpackItems.filter(i => i !== null).length;
            const stillInWorld = window.collectibleBoxes.includes(box);

            return {
                initialBackpackCount,
                finalBackpackCount,
                stillInWorld
            };
        });

        expect(collectionResult.finalBackpackCount).toBe(collectionResult.initialBackpackCount);
        expect(collectionResult.stillInWorld).toBe(true);
    });

    test('Empty box can be collected', async ({ page }) => {
        const collectionResult = await page.evaluate(async () => {
            // Create a new empty box
            const pos = new window.CANNON.Vec3(5, 5, 5);
            const boxBody = window.createBox(pos, null);
            const box = window.collectibleBoxes.find(b => b.body === boxBody);

            // Move player to box
            window.playerBody.position.set(5, 7, 3);
            // Look at box
            // For simplicity, we'll call collectObject directly while mocking the raycast result or just ensuring it's in range

            // We need to ensure raycaster hits it.
            // But we can also just test the logic inside collectObject by ensuring it's reached.
            // Since we are in the browser context, we can just call the logic.

            const initialBackpackCount = window.backpackItems.filter(i => i !== null).length;

            // Mock raycaster hit for collectObject
            const originalRaycast = window.raycaster.intersectObjects;
            window.raycaster.intersectObjects = () => [{
                distance: 1,
                object: box.mesh
            }];

            window.collectObject();

            window.raycaster.intersectObjects = originalRaycast; // restore

            const finalBackpackCount = window.backpackItems.filter(i => i !== null).length;
            const removedFromWorld = !window.collectibleBoxes.includes(box);

            return {
                initialBackpackCount,
                finalBackpackCount,
                removedFromWorld
            };
        });

        expect(collectionResult.finalBackpackCount).toBe(collectionResult.initialBackpackCount + 1);
        expect(collectionResult.removedFromWorld).toBe(true);
    });
});
