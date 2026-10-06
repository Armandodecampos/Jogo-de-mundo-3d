import { test, expect } from '@playwright/test';

test('Mound grass texture is preserved after save and load if created >= 30s ago', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');

    // Click start button (Novo Jogo)
    await page.click('#startButton');

    // Wait for world ready
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

    // Create a mound via window.createMound
    const moundResult = await page.evaluate(() => {
        const fakeIntersect = {
            point: new window.THREE.Vector3(10, 0, 10),
            face: { normal: new window.THREE.Vector3(0, 1, 0) },
            object: window.islandMeshes[0].mesh
        };
        const m = window.createMound(fakeIntersect, true, 'terra'); // positive mound with dirt
        if (m) {
            m.growthStage = 4; // complete stage
            m.height = 1.0;
            m.lastDugAt = window.world.time - 35; // created 35 seconds ago (world time)
        }
        window.updateIslandGeometry();
        return {
            moundCount: window.mounds.length,
            lastDugAt: m ? m.lastDugAt : null,
            worldTime: window.world.time
        };
    });

    expect(moundResult.moundCount).toBeGreaterThan(0);

    // Get current save state
    const saveData = await page.evaluate(() => {
        return window.getGameStateData();
    });

    // Verify saved mound has lastDugAt recorded
    const savedMound = saveData.mounds.find(m => Math.abs(m.position.x - 10) < 1 && Math.abs(m.position.z - 10) < 1);
    expect(savedMound).toBeDefined();
    expect(savedMound.lastDugAt).toBeCloseTo(moundResult.lastDugAt, 1);

    // Perform load
    await page.evaluate((data) => {
        window.loadGameState(data);
    }, saveData);

    // Check vertex color after load. Vertices near (10, 10) should NOT have modified dirt color (0, 1), but should retain standard grass color (1, 1, 1).
    const colorsAreGrass = await page.evaluate(() => {
        const geom = window.islandGeometry;
        const colors = geom.attributes.color.array;
        const hfGridSize = window.hfGridSize;
        const worldSize = 600;
        const step = worldSize / (hfGridSize - 1);
        const mx = Math.round((10 + worldSize / 2) / step);
        const mz = Math.round((worldSize / 2 - 10) / step);
        const cannonJ = (hfGridSize - 1) - mz;
        const j = (hfGridSize - 1) - cannonJ;
        const i = mx;
        const vIdx = (j * hfGridSize + i);

        const r = colors[vIdx * 3];
        const g = colors[vIdx * 3 + 1];

        // If grass, r === 1.0 and g === 1.0. If dirt re-applied, r === 0.0 or < 0.5.
        return { r, g, isGrass: r > 0.9 && g > 0.9 };
    });

    expect(colorsAreGrass.isGrass).toBe(true);
});
