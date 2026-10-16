import { test, expect } from '@playwright/test';

test('Stone interaction hint and actions verification', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('http://localhost:8080/index.htm');

    await page.evaluate(() => {
        localStorage.clear();
    });

    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

    const result = await page.evaluate(async () => {
        // Mock pointerLockElement so animate() performs main raycast and hint updates
        Object.defineProperty(document, 'pointerLockElement', {
            get: () => window.renderer.domElement,
            configurable: true
        });

        // 1. Create a stone close to player position
        const playerPos = window.playerBody ? window.playerBody.position : { x: 0, y: 1, z: 0 };
        const stonePos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z - 1.5);
        window.createStone(stonePos, null);

        // Find the created stone in collectibleBoxes
        const stoneBox = window.collectibleBoxes.find(box => box.body && box.body.userData && box.body.userData.type === 'pedra');
        if (!stoneBox) {
            return { error: 'Stone not found' };
        }

        const isDestructible = stoneBox.body.userData.isDestructible;

        // Position camera to look directly at the stone
        window.camera.position.set(playerPos.x, playerPos.y, playerPos.z);
        window.camera.lookAt(stonePos);

        // Allow animation frame ticks to update currentLookedAtBody and interaction hint
        await new Promise(r => setTimeout(r, 200));

        const currentLookedAt = window.currentLookedAtBody;
        const hintElem = document.getElementById('interactionHint');
        const hintText = hintElem ? hintElem.innerText : '';

        // 2. Test left click collection: collectObject(true) should NOT collect the stone
        const initialBackpackCount = window.backpackItems.filter(i => i && i.name === 'pedra').reduce((acc, i) => acc + i.quantity, 0);
        window.collectObject(true); // Simulate left click release
        const countAfterLeftClick = window.backpackItems.filter(i => i && i.name === 'pedra').reduce((acc, i) => acc + i.quantity, 0);

        // 3. Test 'G' key collection: collectObject(false) SHOULD collect the stone
        window.collectObject(false); // Simulate pressing 'G'
        const countAfterGKey = window.backpackItems.filter(i => i && i.name === 'pedra').reduce((acc, i) => acc + i.quantity, 0);

        return {
            isDestructible,
            hasStoneInBoxes: !!stoneBox,
            currentLookedAtType: currentLookedAt ? currentLookedAt.userData.type : null,
            hintText,
            collectedOnLeftClick: countAfterLeftClick > initialBackpackCount,
            collectedOnGKey: countAfterGKey > countAfterLeftClick
        };
    });

    console.log('Stone test result:', result);

    expect(result.isDestructible).toBe(false);
    expect(result.currentLookedAtType).toBe('pedra');
    expect(result.hintText).toContain('(G) Guardar');
    expect(result.hintText).toContain('(T) Girar');
    expect(result.hintText).not.toContain('(F) Agarrar');
    expect(result.hintText).not.toContain('(E)');
    expect(result.hintText).not.toContain('Destruir');
    expect(result.collectedOnLeftClick).toBe(false);
    expect(result.collectedOnGKey).toBe(true);
});
