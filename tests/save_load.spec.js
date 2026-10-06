import { test, expect } from '@playwright/test';

test('Verify Save and Load functionality including trees position', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('http://localhost:8080/index.htm');

    // Click start button (Novo Jogo)
    await page.click('#startButton');

    // Wait for the game world to be ready
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

    // Check exposed functions
    const hasSave = await page.evaluate(() => typeof window.getGameStateData === 'function' && typeof window.loadGameState === 'function');
    expect(hasSave).toBe(true);

    // Get initial tree position before save
    const initialTreeY = await page.evaluate(() => {
        const treeBody = window.placedConstructionBodies.find(b => b.userData && b.userData.growthStage === 'arvore_adulta');
        return treeBody ? treeBody.position.y : null;
    });

    expect(initialTreeY).not.toBeNull();

    // Generate initial game state
    const state = await page.evaluate(() => {
        return window.getGameStateData();
    });

    expect(state).toBeTruthy();
    expect(state.placedConstructions.length).toBeGreaterThan(0);

    // Load state back
    await page.evaluate((saved) => {
        window.loadGameState(saved);
    }, state);

    // Check tree Y position after load
    const loadedTreeY = await page.evaluate(() => {
        const treeBody = window.placedConstructionBodies.find(b => b.userData && b.userData.growthStage === 'arvore_adulta');
        return treeBody ? treeBody.position.y : null;
    });

    expect(loadedTreeY).toBeCloseTo(initialTreeY, 2);
});
