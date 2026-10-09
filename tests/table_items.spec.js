import { test, expect } from '@playwright/test';

test('Verify small table, wide table, and large table functionality', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    const result = await page.evaluate(async () => {
        const THREE = window.THREE;

        // 1. Check recipes and weights
        const wbRecipes = window.recipes.workbench;
        const hasSmallTableRecipe = wbRecipes.some(r => r.result.name === 'mesa_pequena');
        const hasWideTableRecipe = wbRecipes.some(r => r.result.name === 'mesa');
        const hasLargeTableRecipe = wbRecipes.some(r => r.result.name === 'mesa_grande');

        const smallWeight = window.itemWeights['mesa_pequena'];
        const wideWeight = window.itemWeights['mesa'];
        const largeWeight = window.itemWeights['mesa_grande'];

        if (!hasSmallTableRecipe || !hasWideTableRecipe || !hasLargeTableRecipe) {
            return { success: false, reason: 'Recipes missing for tables' };
        }

        // 2. Create tables in the world
        const posSmall = new THREE.Vector3(0, 0.425, 0);
        const posWide = new THREE.Vector3(3, 0.425, 0);
        const posLarge = new THREE.Vector3(6, 0.425, 0);

        const smallBody = window.createPlaceableBlock(posSmall, new THREE.Quaternion(), 'mesa_pequena');
        const wideBody = window.createPlaceableBlock(posWide, new THREE.Quaternion(), 'mesa');
        const largeBody = window.createPlaceableBlock(posLarge, new THREE.Quaternion(), 'mesa_grande');

        if (!smallBody || !wideBody || !largeBody) {
            return { success: false, reason: 'Failed to create table bodies' };
        }

        // Check static physics and dimensions
        const smallShape = smallBody.shapes[0].halfExtents;
        const wideShape = wideBody.shapes[0].halfExtents;
        const largeShape = largeBody.shapes[0].halfExtents;

        const isSmallCorrect = Math.abs(smallShape.x - 0.4) < 0.01 && Math.abs(smallShape.y - 0.425) < 0.01 && Math.abs(smallShape.z - 0.4) < 0.01;
        const isWideCorrect = Math.abs(wideShape.x - 0.7) < 0.01 && Math.abs(wideShape.y - 0.425) < 0.01 && Math.abs(wideShape.z - 0.4) < 0.01;
        const isLargeCorrect = Math.abs(largeShape.x - 0.8) < 0.01 && Math.abs(largeShape.y - 0.425) < 0.01 && Math.abs(largeShape.z - 0.8) < 0.01;

        if (!isSmallCorrect || !isWideCorrect || !isLargeCorrect) {
            return { success: false, reason: 'Table dimensions incorrect' };
        }

        // 3. Test placing pestle on top of small, wide, and large tables
        // Small/Wide/Large table center Y = 0.425, height = 0.85, top Y = 0.85.
        // Pestle height = 0.3 (halfExtent 0.15). Center Y should be 0.85 + 0.15 = 1.0.
        const pestleSmallPos = new THREE.Vector3(0, 1.0, 0);
        const pestleWidePos = new THREE.Vector3(3, 1.0, 0);
        const pestleLargePos = new THREE.Vector3(6, 1.0, 0);

        const pestleSmallBody = window.createPlaceableBlock(pestleSmallPos, new THREE.Quaternion(), 'pilao');
        const pestleWideBody = window.createPlaceableBlock(pestleWidePos, new THREE.Quaternion(), 'pilao');
        const pestleLargeBody = window.createPlaceableBlock(pestleLargePos, new THREE.Quaternion(), 'pilao');

        if (!pestleSmallBody || !pestleWideBody || !pestleLargeBody) {
            return { success: false, reason: 'Failed to create pestle bodies on tables' };
        }

        const smallTableTopY = smallBody.position.y + smallBody.shapes[0].halfExtents.y;
        const pestleSmallBottomY = pestleSmallBody.position.y - pestleSmallBody.shapes[0].halfExtents.y;
        const gapSmall = Math.abs(pestleSmallBottomY - smallTableTopY);

        const wideTableTopY = wideBody.position.y + wideBody.shapes[0].halfExtents.y;
        const pestleWideBottomY = pestleWideBody.position.y - pestleWideBody.shapes[0].halfExtents.y;
        const gapWide = Math.abs(pestleWideBottomY - wideTableTopY);

        const largeTableTopY = largeBody.position.y + largeBody.shapes[0].halfExtents.y;
        const pestleLargeBottomY = pestleLargeBody.position.y - pestleLargeBody.shapes[0].halfExtents.y;
        const gapLarge = Math.abs(pestleLargeBottomY - largeTableTopY);

        return {
            success: true,
            smallWeight,
            wideWeight,
            largeWeight,
            smallStatic: smallBody.type === 2, // CANNON.Body.STATIC = 2
            wideStatic: wideBody.type === 2,
            largeStatic: largeBody.type === 2,
            gapSmall,
            gapWide,
            gapLarge
        };
    });

    expect(result.success).toBe(true);
    expect(result.smallWeight).toBe(6.0);
    expect(result.wideWeight).toBe(10.0);
    expect(result.largeWeight).toBe(16.0);
    expect(result.smallStatic).toBe(true);
    expect(result.wideStatic).toBe(true);
    expect(result.largeStatic).toBe(true);
    expect(result.gapSmall).toBeLessThan(0.001);
    expect(result.gapWide).toBeLessThan(0.001);
    expect(result.gapLarge).toBeLessThan(0.001);
});
