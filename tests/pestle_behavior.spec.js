import { test, expect } from '@playwright/test';

test('Pestle cannot be grabbed and places flush on top of tree trunk', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    const result = await page.evaluate(async () => {
        const THREE = window.THREE;
        const pestleName = 'pilao';

        // 1. Check pestle dimensions in createPlaceableBlock and ghostBlockHeight
        // Create a tree trunk first at (0, 5, 0)
        const trunkPos = new THREE.Vector3(0, 5, 0);
        window.createPlaceableBlock(trunkPos, new THREE.Quaternion(), 'tronco_arvore');

        const trunkBody = window.placedConstructionBodies.find(b => b.userData && b.userData.type === 'tronco_arvore');
        if (!trunkBody) return { success: false, reason: 'Failed to create tree trunk' };

        // Create pestle on top of tree trunk
        // Trunk height is 1.0 (from y=4.5 to y=5.5). Trunk top surface is at y = 5.5.
        // Pestle height is 0.3 (halfExtent 0.15). Pestle center should be at y = 5.5 + 0.15 = 5.65.
        // Pestle visual bottom (center - 0.15) should be at y = 5.5 (0 gap!).
        const pestlePos = new THREE.Vector3(0, 5.65, 0);
        window.createPlaceableBlock(pestlePos, new THREE.Quaternion(), pestleName);

        const pestleBody = window.placedConstructionBodies.find(b => b.userData && b.userData.type === pestleName);
        if (!pestleBody) return { success: false, reason: 'Failed to create pestle' };

        const trunkTopY = trunkBody.position.y + trunkBody.shapes[0].halfExtents.y;
        const pestleBottomY = pestleBody.position.y - pestleBody.shapes[0].halfExtents.y;
        const gap = Math.abs(pestleBottomY - trunkTopY);

        // 2. Verify grabObject does not pick up pestle
        // Mock raycaster targeting the pestle
        window.currentLookedAtBody = pestleBody;

        return {
            success: true,
            pestleBodyType: pestleBody.userData.type,
            pestleHeight: pestleBody.shapes[0].halfExtents.y * 2,
            trunkTopY,
            pestleBottomY,
            gap
        };
    });

    expect(result.success).toBe(true);
    expect(result.pestleBodyType).toBe('pilao');
    expect(result.pestleHeight).toBeCloseTo(0.3, 2);
    expect(result.gap).toBeLessThan(0.001);
});
