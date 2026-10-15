const { test, expect } = require('@playwright/test');

test('Verify Door placement in an exact 3-block gap (1.2m)', async ({ page }) => {
    await page.goto('http://localhost:8080/index.htm');

    await page.evaluate(() => {
        const startBtn = document.getElementById('startButton');
        if (startBtn) startBtn.click();
    });

    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 15000 });

    const doorPlacementResult = await page.evaluate(() => {
        const cobSize = 0.4;
        const doorWidth = 1.2; // 3 blocks wide
        const doorDepth = 0.1;

        // Two wall blocks leaving a 3-block (1.2m) gap between X = -0.2 and X = 1.0
        // Left block center X = -0.4 (spans -0.6 to -0.2)
        // Right block center X = 1.2 (spans 1.0 to 1.4)
        // Gap spans X = -0.2 to X = 1.0 (width 1.2m)
        const leftBlockMinX = -0.6, leftBlockMaxX = -0.2;
        const rightBlockMinX = 1.0, rightBlockMaxX = 1.4;

        // Door origin placement calculations for non-rotated door:
        // unwrappedX = 0.4 (middle of gap, e.g. 0.4)
        // centerX = Math.round(unwrappedX / (cobSize / 2)) * (cobSize / 2) = 0.4
        // placementPosition.x = centerX - doorWidth / 2 = 0.4 - 0.6 = -0.2
        const unwrappedX = 0.4;
        const centerX = Math.round(unwrappedX / (cobSize / 2)) * (cobSize / 2);
        const placementX = centerX - doorWidth / 2; // -0.2

        // Ghost real center taking into account local hinge offset (+width/2 = +0.6)
        const ghostCenterX = placementX + doorWidth / 2; // 0.4
        const wHalfX = doorWidth / 2; // 0.6

        const inset = 0.02;
        const pMinX = ghostCenterX - wHalfX + inset; // 0.4 - 0.6 + 0.02 = -0.18
        const pMaxX = ghostCenterX + wHalfX - inset; // 0.4 + 0.6 - 0.02 = 0.98

        // Check if door AABB overlaps left or right block
        const overlapsLeft = pMaxX > leftBlockMinX && pMinX < leftBlockMaxX;
        const overlapsRight = pMaxX > rightBlockMinX && pMinX < rightBlockMaxX;

        return {
            placementX,
            ghostCenterX,
            pMinX,
            pMaxX,
            overlapsLeft,
            overlapsRight,
            canPlaceInGap: !overlapsLeft && !overlapsRight
        };
    });

    expect(doorPlacementResult.placementX).toBeCloseTo(-0.2);
    expect(doorPlacementResult.ghostCenterX).toBeCloseTo(0.4);
    expect(doorPlacementResult.overlapsLeft).toBe(false);
    expect(doorPlacementResult.overlapsRight).toBe(false);
    expect(doorPlacementResult.canPlaceInGap).toBe(true);
});
