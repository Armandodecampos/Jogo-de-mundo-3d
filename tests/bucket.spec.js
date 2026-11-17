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

    test('placing a bucket in the sea fills it immediately', async ({ page }) => {
        const result = await page.evaluate(() => {
            const seaPosition = new THREE.Vector3(250, window.waterLevel + 0.25, 100);
            const isSeaPosition = window.hasWaterAt(seaPosition.x, seaPosition.z);
            const ghost = window.ghostBlockMesh;
            ghost.visible = true;
            ghost.material.color.setHex(0x00ff00);
            ghost.position.copy(seaPosition);

            const item = { name: 'balde_vazio', quantity: 1 };
            window.placeBlock(item, window.beltItems.length);

            const placedBucket = window.collectibleBoxes.find(({ body }) =>
                body.userData.type === 'balde_vazio'
            );
            const saveData = window.getGameStateData();
            const savedAsSaltWater = saveData.groundItems.find(item =>
                item.type === 'balde_vazio'
            ).userData.isSaltWater;
            window.loadGameState(saveData);
            const restoredBucket = window.collectibleBoxes.find(({ body }) =>
                body.userData.type === 'balde_vazio'
            );
            window.raycaster.intersectObjects = () => [{ distance: 1, object: restoredBucket.mesh }];
            window.collectObject();
            const collectedSaltWaterBucket = window.getGameStateData().inventory.backpackItems.find(item =>
                item && item.name === 'balde_agua_salgada'
            );
            return {
                isSeaPosition,
                itemWasConsumed: item.quantity === 0,
                isFull: placedBucket.body.userData.hasWater,
                waterIsVisible: placedBucket.body.userData.waterMesh.visible,
                savedAsSaltWater,
                collectedItemName: collectedSaltWaterBucket && collectedSaltWaterBucket.name,
                displayName: window.itemDisplayNames.balde_agua_salgada
            };
        });

        expect(result.isSeaPosition).toBe(true);
        expect(result.itemWasConsumed).toBe(true);
        expect(result.isFull).toBe(true);
        expect(result.waterIsVisible).toBe(true);
        expect(result.savedAsSaltWater).toBe(true);
        expect(result.collectedItemName).toBe('balde_agua_salgada');
        expect(result.displayName).toBe('Balde de água salgada');
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

    test('aiming at water buckets offers drinking and warns against salt water', async ({ page }) => {
        const result = await page.evaluate(() => {
            Object.defineProperty(document, 'pointerLockElement', {
                get: () => window.renderer.domElement,
                configurable: true
            });

            const emptyBucket = window.createBucket(new THREE.Vector3(0, 1, -2), null);
            const freshWaterBucket = window.createBucket(new THREE.Vector3(0, 1, -2), null, true);
            const saltWaterBucket = window.createBucket(new THREE.Vector3(0, 1, -2), null, true, undefined, true);
            const buckets = [emptyBucket, freshWaterBucket, saltWaterBucket].map(body =>
                window.collectibleBoxes.find(({ body: candidate }) => candidate === body)
            );
            const originalRaycast = window.raycaster.intersectObjects;

            const hints = buckets.map(bucket => {
                window.raycaster.intersectObjects = () => [{
                    distance: 1,
                    object: bucket.mesh
                }];
                window.animate();
                return document.getElementById('interactionHint').textContent;
            });

            window.raycaster.intersectObjects = () => [{
                distance: 1,
                object: buckets[2].mesh
            }];
            const initialInventory = window.getGameStateData().inventory.backpackItems;
            window.renderer.domElement.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
            window.renderer.domElement.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
            const saltWaterMessage = document.getElementById('notification').textContent;
            window.raycaster.intersectObjects = originalRaycast;

            return {
                hints,
                saltWaterMessage,
                bucketStillInWorld: window.collectibleBoxes.some(({ body }) => body === saltWaterBucket),
                inventoryUnchanged: JSON.stringify(window.getGameStateData().inventory.backpackItems) === JSON.stringify(initialInventory)
            };
        });

        expect(result.hints[0]).toBe('Balde vazio\n(G) Guardar');
        expect(result.hints[1]).toBe('Balde de água\n(Botão Esq.) Beber / (G) Guardar');
        expect(result.hints[2]).toBe('Balde de água salgada\n(Botão Esq.) Beber / (G) Guardar');
        expect(result.saltWaterMessage).toBe('Não é possível beber água salgada!');
        expect(result.bucketStillInWorld).toBe(true);
        expect(result.inventoryUnchanged).toBe(true);
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

    test('rain creates smaller, shorter-lived ground splashes at triple density', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalRandom = Math.random;
            Math.random = () => 0;
            window.rainPuddles.splice(0).forEach(({ mesh }) => {
                window.scene.remove(mesh);
                mesh.material.dispose();
            });
            window.targetRainIntensity = 1;
            window.rainIntensity = 1;
            window.lastWeatherChange = window.world.time;
            window.nextWeatherDuration = 1000;
            for (let i = 0; i < 10; i++) window.updateWeather(0.05);

            const appeared = window.rainPuddles.length > 0;
            const firstSplash = appeared ? window.rainPuddles[0] : null;
            const splashCount = window.rainPuddles.length;

            window.targetRainIntensity = 0;
            window.rainIntensity = 0;
            window.updateWeather(2);
            Math.random = originalRandom;

            return {
                appeared,
                puddleY: firstSplash?.mesh.position.y ?? null,
                width: firstSplash?.width ?? null,
                depth: firstSplash?.depth ?? null,
                lifetime: firstSplash?.lifetime ?? null,
                splashCount,
                disappeared: window.rainPuddles.length === 0
            };
        });

        expect(result.appeared).toBe(true);
        expect(result.puddleY).toBeGreaterThan(-8);
        expect(result.width).toBeLessThanOrEqual(0.4);
        expect(result.depth).toBeLessThanOrEqual(0.25);
        expect(result.lifetime).toBeLessThanOrEqual(5 / 3);
        expect(result.splashCount).toBeGreaterThanOrEqual(9);
        expect(result.disappeared).toBe(true);
    });
});
