const { test, expect } = require('@playwright/test');

test.describe('Bucket rain and collection', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
    });

    test('can be placed, fills in rain, and remains full after saving and collecting', async ({ page }) => {
        const result = await page.evaluate(() => {
            const ghost = window.ghostBlockMesh;
            ghost.visible = true;
            ghost.material.color.setHex(0x00ff00);
            ghost.position.set(6, 1, 6);
            const item = { name: 'balde_vazio', quantity: 1 };
            window.placeBlock(item, window.beltItems.length);

            window.targetRainIntensity = 1;
            window.rainIntensity = 1;
            window.updateWeather(0);
            const saveData = window.getGameStateData();
            window.loadGameState(saveData);

            const restoredBucket = window.collectibleBoxes.find(
                ({ body }) => body.userData.type === 'balde_vazio'
            );
            const savedAsFull = saveData.groundItems.find(item => item.type === 'balde_vazio').userData.hasWater;
            const restoredAsFull = restoredBucket.body.userData.hasWater && restoredBucket.body.userData.waterMesh.visible;

            window.raycaster.intersectObjects = () => [{ distance: 1, object: restoredBucket.mesh }];
            const collectionResult = window.collectObject();

            const collectedBucket = window.getGameStateData().inventory.backpackItems.find(
                item => item && item.name === 'balde_agua'
            );
            return {
                itemWasConsumed: item.quantity === 0,
                savedAsFull,
                restoredAsFull,
                collectionResult,
                collectedItemName: collectedBucket && collectedBucket.name,
                displayName: window.itemDisplayNames.balde_agua,
                placementAction: window.getActionType({ name: 'balde_agua' })
            };
        });

        expect(result.itemWasConsumed).toBe(true);
        expect(result.savedAsFull).toBe(true);
        expect(result.restoredAsFull).toBe(true);
        expect(result.collectionResult).toBe(true);
        expect(result.collectedItemName).toBe('balde_agua');
        expect(result.displayName).toBe('Balde de água');
        expect(result.placementAction).toBe('place');
    });

    test('collecting a dry bucket adds a Balde vazio', async ({ page }) => {
        const result = await page.evaluate(() => {
            const body = window.createBucket(new THREE.Vector3(5, 1, 5), null);
            const bucket = window.collectibleBoxes.find(item => item.body === body);
            window.raycaster.intersectObjects = () => [{ distance: 1, object: bucket.mesh }];
            window.collectObject();
            return {
                collected: window.backpackItems.some(item => item && item.name === 'balde_vazio'),
                displayName: window.itemDisplayNames.balde_vazio
            };
        });

        expect(result.collected).toBe(true);
        expect(result.displayName).toBe('Balde vazio');
    });
});
