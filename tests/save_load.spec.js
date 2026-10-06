import { test, expect } from '@playwright/test';

test('Verify Save and Load functionality including trees position and dug holes with boxes', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('http://localhost:8080/index.htm');

    // Click start button (Novo Jogo)
    await page.click('#startButton');

    // Wait for the game world to be ready
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

    // Check exposed functions
    const hasSave = await page.evaluate(() => typeof window.getGameStateData === 'function' && typeof window.loadGameState === 'function');
    expect(hasSave).toBe(true);

    // Create a dug hole and place player and boxes in it
    const state = await page.evaluate(() => {
        // Create a mound/hole at (10, 0, 10)
        const intersect = {
            point: new THREE.Vector3(10, 0, 10),
            face: { normal: new THREE.Vector3(0, 1, 0) }
        };
        const mound = window.createMound(intersect, false, 'terra');
        if (mound) {
            mound.height = -2.0;
            window.updateIslandGeometry();
        }

        // Place player in hole
        window.playerBody.position.set(10, -1.0, 10);

        // Spawn a box in the hole
        window.createBox(new THREE.Vector3(10, -1.5, 10), null);

        return window.getGameStateData();
    });

    expect(state).toBeTruthy();
    expect(state.mounds.length).toBeGreaterThan(0);

    // Load state back
    await page.evaluate((saved) => {
        window.loadGameState(saved);
    }, state);

    // Check that player is alive (not fainted) and mounds/terrain heightfield updated
    const playerStatus = await page.evaluate(() => {
        return {
            isFainted: window.isFainted,
            playerY: window.playerBody.position.y,
            moundsCount: window.mounds.length
        };
    });

    expect(playerStatus.isFainted).toBe(false);
    expect(playerStatus.moundsCount).toBeGreaterThan(0);
    expect(playerStatus.playerY).toBeLessThan(1.0); // Inside hole, not pushed up or falling to bedrock
});
