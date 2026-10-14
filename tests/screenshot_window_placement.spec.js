const { test, expect } = require('@playwright/test');

test('Capture window placement visual screenshot', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

    await page.evaluate(() => {
        const THREE = window.THREE;

        // Position player
        window.playerBody.position.set(0, 2.0, -1.0);
        window.camera.position.set(0, 2.0, -1.0);
        window.camera.lookAt(new THREE.Vector3(0, 1.0, -3.0));

        // Create base block 1 and block 2 adjacent
        const b1 = window.createPlaceableBlock(new THREE.Vector3(-0.2, 0.8, -3.0), null, window.woodenBlockItemName);
        const b2 = window.createPlaceableBlock(new THREE.Vector3(0.2, 0.8, -3.0), null, window.woodenBlockItemName);

        // Place window spanning on top of the two blocks
        const windowPos = new THREE.Vector3(0.0, 1.4, -3.0);
        window.createPlaceableBlock(windowPos, null, window.windowItemName);

        // Create door next to it on top of another block
        const b3 = window.createPlaceableBlock(new THREE.Vector3(1.0, 0.8, -3.0), null, window.woodenBlockItemName);
        const b4 = window.createPlaceableBlock(new THREE.Vector3(1.4, 0.8, -3.0), null, window.woodenBlockItemName);
        const doorPos = new THREE.Vector3(1.2, 2.2, -3.0);
        window.createPlaceableBlock(doorPos, null, window.doorItemName);

        window.camera.lookAt(new THREE.Vector3(0.5, 1.5, -3.0));
        window.renderer.render(window.scene, window.camera);
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'window_snap_screenshot.png' });
});
