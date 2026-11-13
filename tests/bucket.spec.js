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
            window.lastWeatherChange = window.world.time;
            window.nextWeatherDuration = 1000;
            window.updateWeather(8);
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

    test('bucket water level rises gradually while exposed to rain', async ({ page }) => {
        const result = await page.evaluate(() => {
            const body = window.createBucket(new THREE.Vector3(10, 1, 10), null);
            window.targetRainIntensity = 1;
            window.rainIntensity = 1;
            window.lastWeatherChange = window.world.time;
            window.nextWeatherDuration = 1000;

            window.updateWeather(2);
            const partialFill = {
                progress: body.userData.waterFillProgress,
                isFull: body.userData.hasWater,
                visible: body.userData.waterMesh.visible,
                height: body.userData.waterMesh.scale.y
            };
            window.updateWeather(6);

            return {
                partialFill,
                finalProgress: body.userData.waterFillProgress,
                isFull: body.userData.hasWater
            };
        });

        expect(result.partialFill.progress).toBeGreaterThan(0);
        expect(result.partialFill.progress).toBeLessThan(1);
        expect(result.partialFill.isFull).toBe(false);
        expect(result.partialFill.visible).toBe(true);
        expect(result.partialFill.height).toBeGreaterThan(0);
        expect(result.finalProgress).toBe(1);
        expect(result.isFull).toBe(true);
    });

    test('collecting a dry bucket adds a Balde vazio', async ({ page }) => {
        const result = await page.evaluate(() => {
            const body = window.createBucket(new THREE.Vector3(5, 1, 5), null);
            const bucket = window.collectibleBoxes.find(item => item.body === body);
            window.raycaster.intersectObjects = () => [{ distance: 1, object: bucket.mesh }];
            window.collectObject();
            return {
                collected: window.backpackItems.some(item => item && item.name === 'balde_vazio'),
                displayName: window.itemDisplayNames.balde_vazio,
                insideVisible: bucket.mesh.children[0].material.side === THREE.DoubleSide
            };
        });

        expect(result.collected).toBe(true);
        expect(result.displayName).toBe('Balde vazio');
        expect(result.insideVisible).toBe(true);
    });

    test('only fills buckets exposed to rain', async ({ page }) => {
        const result = await page.evaluate(() => {
            const exposedBucket = window.createBucket(new THREE.Vector3(10, 1, 10), null);
            const coveredBucket = window.createBucket(new THREE.Vector3(20, 1, 20), null);
            window.placedConstructionBodies.push({
                position: new THREE.Vector3(20, 4, 20),
                quaternion: new THREE.Quaternion(),
                userData: { dimensions: { width: 2, height: 0.2, depth: 2 } }
            });

            window.targetRainIntensity = 1;
            window.rainIntensity = 1;
            window.lastWeatherChange = window.world.time;
            window.nextWeatherDuration = 1000;
            window.updateWeather(8);

            return {
                exposedBucketFilled: exposedBucket.userData.hasWater,
                coveredBucketFilled: coveredBucket.userData.hasWater
            };
        });

        expect(result.exposedBucketFilled).toBe(true);
        expect(result.coveredBucketFilled).toBe(false);
    });

    test('rain creates short-lived puddles on the ground', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalRandom = Math.random;
            Math.random = () => 0;
            window.targetRainIntensity = 1;
            window.rainIntensity = 1;
            window.lastWeatherChange = window.world.time;
            window.nextWeatherDuration = 1000;
            window.updateWeather(0.5);

            const appeared = window.rainPuddles.length > 0;
            const puddleY = appeared ? window.rainPuddles[0].mesh.position.y : null;

            window.targetRainIntensity = 0;
            window.rainIntensity = 0;
            window.updateWeather(5);
            Math.random = originalRandom;

            return { appeared, puddleY, disappeared: window.rainPuddles.length === 0 };
        });

        expect(result.appeared).toBe(true);
        expect(result.puddleY).toBeGreaterThan(-8);
        expect(result.disappeared).toBe(true);
    });
});
