const { test, expect } = require('@playwright/test');

test.describe('Player thirst', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
    });

    test('thirst decays and reaching zero causes fainting', async ({ page }) => {
        const result = await page.evaluate(() => {
            const bar = document.getElementById('thirstBarFill');
            const initialWidth = bar.style.width;
            window.thirstDecayRate = 100;
            return { initialWidth, initialThirst: window.playerThirst };
        });

        expect(Number.parseFloat(result.initialWidth)).toBeGreaterThan(0);
        await page.waitForFunction(initialThirst => window.playerThirst < initialThirst, result.initialThirst, { timeout: 30000 });
        await page.waitForFunction(() => window.isFainted === true, { timeout: 30000 });
    });

    test('drinking fresh water restores thirst by sips and empties the bucket', async ({ page }) => {
        const result = await page.evaluate(() => {
            Object.defineProperty(document, 'pointerLockElement', {
                get: () => window.renderer.domElement,
                configurable: true
            });
            window.thirstDecayRate = 0;
            window.playerThirst = 20;

            window.createBucket(new THREE.Vector3(0, 1, -2), null, true);
            window.createBucket(new THREE.Vector3(0, 1, -2), null, true, undefined, true);
            let freshBucket = window.collectibleBoxes.find(({ body }) =>
                body.userData.type === 'balde_vazio' && !body.userData.isSaltWater
            ).body;
            let freshMesh = window.collectibleBoxes.find(({ body }) => body === freshBucket).mesh;
            let targetMesh = freshMesh;
            window.raycaster.intersectObjects = () => [{ distance: 1, object: targetMesh }];

            const waterLevels = [];
            window.renderer.domElement.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
            window.renderer.domElement.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
            waterLevels.push(freshBucket.userData.waterFillProgress);
            const savedState = window.getGameStateData();
            window.loadGameState(savedState);

            freshBucket = window.collectibleBoxes.find(({ body }) =>
                body.userData.type === 'balde_vazio' && !body.userData.isSaltWater &&
                body.userData.waterFillProgress > 0
            ).body;
            freshMesh = window.collectibleBoxes.find(({ body }) => body === freshBucket).mesh;
            targetMesh = freshMesh;
            const thirstAfterLoad = window.playerThirst;
            for (let sip = 0; sip < 3; sip++) {
                window.renderer.domElement.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
                window.renderer.domElement.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
                waterLevels.push(freshBucket.userData.waterFillProgress);
            }
            const thirstAfterFreshWater = window.playerThirst;
            const saltBucket = window.collectibleBoxes.find(({ body }) =>
                body.userData.type === 'balde_vazio' && body.userData.isSaltWater
            );
            targetMesh = saltBucket.mesh;
            window.renderer.domElement.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
            window.renderer.domElement.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
            window.animate();

            return {
                waterLevels,
                savedThirst: savedState.player.thirst,
                thirstAfterLoad,
                thirstAfterFreshWater,
                thirstAfterSaltWater: window.playerThirst,
                saltWaterMessage: document.getElementById('notification').textContent,
                saltWaterHint: document.getElementById('interactionHint').textContent
            };
        });

        expect(result.waterLevels).toEqual([0.75, 0.5, 0.25, 0]);
        expect(result.savedThirst).toBe(45);
        expect(result.thirstAfterLoad).toBe(45);
        expect(result.thirstAfterFreshWater).toBe(100);
        expect(result.thirstAfterSaltWater).toBe(100);
        expect(result.saltWaterMessage).toBe('Não é possível beber água salgada!');
        expect(result.saltWaterHint).toContain('Não é possível beber água salgada');
    });
});
