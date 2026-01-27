
const { test, expect } = require('@playwright/test');
const path = require('path');

test('Verify world wrap and chest texture', async ({ page }) => {
    // Navigate to the local server
    await page.goto('http://localhost:8080');

    // Click "Jogar" to start the game
    await page.click('#startButton');

    // Wait for the world to be ready
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

    // 1. Verify chest material has a texture
    const hasChestTexture = await page.evaluate(() => {
        return window.chestMaterialMesh && window.chestMaterialMesh.map !== null;
    });
    expect(hasChestTexture).toBe(true);
    console.log('Chest texture verified.');

    // 2. Verify world wrap doesn't make world disappear
    // Move player to near the wrap boundary
    await page.evaluate(() => {
        window.playerBody.position.x = 595;
        window.playerBody.velocity.set(10, 0, 0); // Moving towards 600
    });

    // Wait for a few frames to let it wrap
    await page.waitForTimeout(1000);

    // Verify player wrapped and world is still visible (by checking if ground meshes are near)
    const isWorldVisible = await page.evaluate(() => {
        const playerX = window.playerBody.position.x;
        // Should have wrapped to around -600
        const isWrapped = playerX < 0;

        // Check if central island mesh is correctly positioned relative to player
        // Since visualOffsetX is now 0, and player is at ~-600,
        // the tile with offsetX=0 is at 0, distance 600.
        // the tile with offsetX=-1200 is at -1200, distance 600.
        // wait, if player is at -600, they are EXACTLY between tile 0 and tile -1200.
        // Both should be at distance 600 from camera?
        // Actually, player is ALWAYS inside some tile.

        // Let's just check if there is ANY mesh within renderDistance
        const meshes = window.scene.children.filter(c => c.isMesh || c.isGroup);
        const visibleMeshes = meshes.filter(m => {
            const dist = window.camera.position.distanceTo(m.position);
            return dist < 250; // A bit more than renderDistance to be safe
        });

        return isWrapped && visibleMeshes.length > 0;
    });

    expect(isWorldVisible).toBe(true);
    console.log('World wrap visibility verified.');

    // Take a screenshot for manual verification
    await page.screenshot({ path: 'verification.png' });
});
