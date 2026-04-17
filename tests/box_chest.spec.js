const { test, expect } = require('@playwright/test');

test.describe('Box Chest Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true);
    });

    test('Starting object at (0,-5) is a box and has inventory', async ({ page }) => {
        const starterInventory = await page.evaluate(() => {
            // Find the object at (0, -5)
            // We know it's the first box created in this case, or we can look for it
            const starter = window.collectibleBoxes.find(b =>
                Math.abs(b.body.position.x) < 1 && Math.abs(b.body.position.z + 5) < 1
            );
            if (!starter) return null;
            return {
                type: starter.body.userData.type,
                isChest: starter.body.userData.isChest,
                hasInventory: Array.isArray(starter.body.userData.inventory),
                inventorySize: starter.body.userData.inventory ? starter.body.userData.inventory.length : 0,
                contentCount: starter.body.userData.inventory ? starter.body.userData.inventory.filter(i => i !== null).length : 0
            };
        });

        expect(starterInventory).not.toBeNull();
        expect(starterInventory.type).toBe('caixote');
        expect(starterInventory.isChest).toBe(true);
        expect(starterInventory.hasInventory).toBe(true);
        expect(starterInventory.inventorySize).toBe(50);
        expect(starterInventory.contentCount).toBeGreaterThan(0);
    });

    test('Non-empty box cannot be collected', async ({ page }) => {
        const collectionResult = await page.evaluate(async () => {
            // Find the starter box
            const starter = window.collectibleBoxes.find(b =>
                Math.abs(b.body.position.x) < 1 && Math.abs(b.body.position.z + 5) < 1
            );
            if (!starter) return "not found";

            // Move player to starter box
            window.playerBody.position.set(0, starter.body.position.y + 2, -3);
            window.playerBody.quaternion.setFromEuler(0, Math.PI, 0); // Look at -Z

            const initialBackpackCount = window.backpackItems.filter(i => i !== null).length;

            // Try to collect
            window.collectObject();

            const finalBackpackCount = window.backpackItems.filter(i => i !== null).length;
            const stillInWorld = window.collectibleBoxes.includes(starter);

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
