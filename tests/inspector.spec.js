const { test, expect } = require('@playwright/test');

test.describe('Inspector Mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        // Wait for world to be ready
        await page.waitForFunction(() => window.isWorldReady === true);
    });

    test('should toggle inspector mode with keyboard key I', async ({ page }) => {
        // Initial state should be hidden
        const display = page.locator('#inspectorDisplay');
        await expect(display).toBeHidden();

        // Press I to enable
        await page.keyboard.press('i');
        await expect(display).toBeVisible();

        // Press I to disable
        await page.keyboard.press('i');
        await expect(display).toBeHidden();
    });

    test('should identify elements when targeted', async ({ page }) => {
        test.setTimeout(60000);
        await page.keyboard.press('i');
        const display = page.locator('#inspectorDisplay');
        await expect(display).toBeVisible();

        // By default looking forward at (0,0,0) might hit terrain
        await page.waitForTimeout(500);
        let text = await display.textContent();
        expect(text).toContain('Mirando em:');

        // Force looking at sky (up) - avoid sun/moon positions
        await page.evaluate(() => {
            // Sun is at orbitRadius * sin(theta). theta changes with time.
            // Pointing straight up should usually hit sky unless sun/moon is directly overhead.
            // Let's also disable auto-rotation for the test if possible, or just pick a safe angle.
            window.camera.rotation.set(Math.PI / 3, Math.PI / 2, 0); // Looking at a generic sky direction
            window.camera.updateMatrixWorld();
        });
        await page.waitForTimeout(500);
        text = await display.textContent();
        expect(text).toContain('(sky)');

        // Force looking at water (down/side depending on position)
        await page.evaluate(() => {
            window.playerBody.position.set(250, 10, 0); // Out in the ocean
            window.camera.rotation.set(-Math.PI / 4, 0, 0);
            window.camera.updateMatrixWorld();
        });
        await page.waitForTimeout(500);
        text = await display.textContent();
        expect(text).toContain('Água (water)');

        // Force looking at terrain (center)
        await page.evaluate(() => {
            window.playerBody.position.set(0, 10, 0);
            window.camera.rotation.set(-Math.PI / 2, 0, 0);
            window.camera.updateMatrixWorld();
        });
        await page.waitForTimeout(500);
        text = await display.textContent();
        expect(text).toContain('Terra/Gramado (dirt_grass)');
    });

    test('should identify sun and moon', async ({ page }) => {
        await page.keyboard.press('i');
        const display = page.locator('#inspectorDisplay');

        // Setup environment for visibility
        await page.evaluate(() => {
            // Remove clouds
            window.clouds.forEach(c => window.scene.remove(c.mesh));
            window.clouds.length = 0;
            // Set time to noon
            window.world.time = 0;
            // Teleport player high
            window.playerBody.position.set(0, 100, 0);
        });
        await page.waitForTimeout(500);

        // Find sun position and point camera at it
        await page.evaluate(() => {
            window.camera.lookAt(window.sunMesh.position);
            window.camera.updateMatrixWorld();
        });
        await page.waitForTimeout(500);
        let text = await display.textContent();
        expect(text).toContain('Sol (sun)');

        // Set time to midnight for moon
        await page.evaluate(() => {
            // dayDuration is 300
            window.world.time = 150;
        });
        await page.waitForTimeout(500);

        // Find moon position and point camera at it
        await page.evaluate(() => {
            window.camera.lookAt(window.moonMesh.position);
            window.camera.updateMatrixWorld();
        });
        await page.waitForTimeout(500);
        text = await display.textContent();
        expect(text).toContain('Lua (moon)');
    });
});
