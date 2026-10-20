const { test, expect } = require('@playwright/test');

test.describe('Chest Options Menu Functionality', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });
        await page.evaluate(() => {
            Object.defineProperty(document, 'pointerLockElement', {
                get: () => window.renderer.domElement,
                configurable: true
            });
        });
    });

    test('Interaction hint for caixote and cesto_capim displays (Botão Esq.) Abrir / (E) Opções', async ({ page }) => {
        const hintTexts = await page.evaluate(async () => {
            // Spawn box and basket near player
            const posBox = new window.CANNON.Vec3(0, 2, -3);
            const boxBody = window.createBox(posBox, null);
            const box = window.collectibleBoxes.find(b => b.body === boxBody);

            const posBasket = new window.CANNON.Vec3(3, 2, -3);
            const basketBody = window.createBasket(posBasket, null);
            const basket = window.collectibleBoxes.find(b => b.body === basketBody);

            window.updateRaycastTargets();
            window.playerBody.position.set(0, 2, -1);

            // Mock raycast for box
            const originalRaycast = window.raycaster.intersectObjects;
            window.raycaster.intersectObjects = () => [{
                distance: 1.5,
                object: box.mesh
            }];

            window.animate();
            const boxHint = document.getElementById('interactionHint').textContent;

            // Mock raycast for basket
            window.raycaster.intersectObjects = () => [{
                distance: 1.5,
                object: basket.mesh
            }];

            window.animate();
            const basketHint = document.getElementById('interactionHint').textContent;

            window.raycaster.intersectObjects = originalRaycast; // restore

            return { boxHint, basketHint };
        });

        expect(hintTexts.boxHint).toBe('(Botão Esq.) Abrir / (E) Opções');
        expect(hintTexts.basketHint).toBe('(Botão Esq.) Abrir / (E) Opções');
    });

    test('Key E opens #chestOptionsMenu and NOT #chestModal when aiming at box', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const pos = new window.CANNON.Vec3(0, 2, -3);
            const boxBody = window.createBox(pos, null);
            const box = window.collectibleBoxes.find(b => b.body === boxBody);

            window.updateRaycastTargets();
            window.playerBody.position.set(0, 2, -1);

            const originalRaycast = window.raycaster.intersectObjects;
            window.raycaster.intersectObjects = () => [{
                distance: 1.5,
                object: box.mesh
            }];

            // Simulate pressing 'e'
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));

            window.raycaster.intersectObjects = originalRaycast;

            const chestOptionsMenuHidden = document.getElementById('chestOptionsMenu').classList.contains('hidden');
            const chestModalHidden = document.getElementById('chestModal').classList.contains('hidden');

            return {
                chestOptionsMenuHidden,
                chestModalHidden
            };
        });

        expect(result.chestOptionsMenuHidden).toBe(false);
        expect(result.chestModalHidden).toBe(true);
    });

    test('Left click opens #chestModal when aiming at box', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const pos = new window.CANNON.Vec3(0, 2, -3);
            const boxBody = window.createBox(pos, null);
            const box = window.collectibleBoxes.find(b => b.body === boxBody);

            window.updateRaycastTargets();
            window.playerBody.position.set(0, 2, -1);

            const originalRaycast = window.raycaster.intersectObjects;
            window.raycaster.intersectObjects = () => [{
                distance: 1.5,
                object: box.mesh
            }];

            // Call interact() directly (which left-click calls in mousedown)
            window.interact();

            window.raycaster.intersectObjects = originalRaycast;

            const chestModalHidden = document.getElementById('chestModal').classList.contains('hidden');

            return { chestModalHidden };
        });

        expect(result.chestModalHidden).toBe(false);
    });

    test('Girar button rotates box quaternion', async ({ page }) => {
        const rotationResult = await page.evaluate(async () => {
            const pos = new window.CANNON.Vec3(0, 2, -3);
            const boxBody = window.createBox(pos, null);

            window.openChestOptionsMenu(boxBody);

            const initialQuatY = boxBody.quaternion.y;

            window.handleChestOptionsRotate();

            const finalQuatY = boxBody.quaternion.y;

            window.closeChestOptionsMenu();

            return { initialQuatY, finalQuatY };
        });

        expect(rotationResult.finalQuatY).not.toBe(rotationResult.initialQuatY);
    });

    test('Guardar collects empty box and blocks non-empty box', async ({ page }) => {
        const storeResult = await page.evaluate(async () => {
            // Test non-empty box
            const pos1 = new window.CANNON.Vec3(0, 2, -3);
            const boxBody1 = window.createBox(pos1, null);
            window.addItemToInventory(boxBody1.userData.inventory, { name: 'pedra', quantity: 1 }, 200, true);

            window.openChestOptionsMenu(boxBody1);
            window.handleChestOptionsStore(); // Should show notification & fail

            const box1StillInWorld = window.collectibleBoxes.some(b => b.body === boxBody1);
            window.closeChestOptionsMenu();

            // Test empty box
            const pos2 = new window.CANNON.Vec3(5, 2, -3);
            const boxBody2 = window.createBox(pos2, null);

            window.openChestOptionsMenu(boxBody2);
            window.handleChestOptionsStore(); // Should collect

            const box2RemovedFromWorld = !window.collectibleBoxes.some(b => b.body === boxBody2);

            return {
                box1StillInWorld,
                box2RemovedFromWorld
            };
        });

        expect(storeResult.box1StillInWorld).toBe(true);
        expect(storeResult.box2RemovedFromWorld).toBe(true);
    });
});
