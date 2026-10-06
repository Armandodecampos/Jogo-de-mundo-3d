import { test, expect } from '@playwright/test';

test('Verify Save and Load functionality', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('http://localhost:8080/index.htm');

    // Click start button (Novo Jogo)
    await page.click('#startButton');

    // Wait for the game world to be ready
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

    // Check exposed functions
    const hasSave = await page.evaluate(() => typeof window.getGameStateData === 'function' && typeof window.loadGameState === 'function');
    expect(hasSave).toBe(true);

    // Generate initial game state
    const state = await page.evaluate(() => {
        // Place a block
        const pos = new THREE.Vector3(10, 1, 10);
        window.createPlaceableBlock(pos, new THREE.Quaternion(), 'cob');
        return window.getGameStateData();
    });

    expect(state).toBeTruthy();
    expect(state.placedConstructions.length).toBeGreaterThan(0);

    // Modify player health in memory and reload
    await page.evaluate(() => {
        window.playerHealth = 50;
    });

    // Load state back
    await page.evaluate((saved) => {
        window.loadGameState(saved);
    }, state);

    // Check placed constructions
    const constructionCount = await page.evaluate(() => window.placedConstructionBodies.length);
    expect(constructionCount).toBeGreaterThan(0);
});
