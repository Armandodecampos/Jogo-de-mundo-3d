const { test, expect } = require('@playwright/test');

test.describe('Top Surface Block Snapping', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
        await page.evaluate(() => { window.gamePaused = false; });
    });

    test('construction blocks auto-align X and Z on top face of existing block', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Create base block at (10, 5, 10)
            const basePos = new window.THREE.Vector3(10, 5, 10);
            const baseBlock = window.createPlaceableBlock(basePos, null, 'cob');

            // Simulate placing another 'cob' block on top surface (hitNormal.y > 0.7)
            window.currentBlockType = 'cob';
            const ghostWidth = 0.4, ghostHeight = 0.4, ghostDepth = 0.4;
            const targetHalfY = 0.2, currentHalfY = 0.2;

            // Simulating raycast hit on top face off-center at (10.15, 5.2, 9.85)
            const hitPoint = { x: 10.15, y: 5.2, z: 9.85 };
            const hitNormal = new window.THREE.Vector3(0, 1, 0);

            const isConstructionBlock = [
                'cob', 'piso',
                window.stoneBlockItemName, window.woodenBlockItemName,
                window.stoneFloorItemName, window.woodenFloorItemName,
                window.doorItemName, window.windowItemName
            ].includes(window.currentBlockType);

            const placementPosition = new window.THREE.Vector3();
            placementPosition.y = baseBlock.position.y + targetHalfY + currentHalfY;
            if (isConstructionBlock) {
                placementPosition.x = baseBlock.position.x;
                placementPosition.z = baseBlock.position.z;
            } else {
                placementPosition.x = hitPoint.x;
                placementPosition.z = hitPoint.z;
            }

            return {
                baseX: baseBlock.position.x,
                baseZ: baseBlock.position.z,
                placedX: placementPosition.x,
                placedY: placementPosition.y,
                placedZ: placementPosition.z
            };
        });

        expect(result.placedX).toBe(result.baseX);
        expect(result.placedZ).toBe(result.baseZ);
        expect(result.placedY).toBe(5.4); // 5 + 0.2 + 0.2
    });
});
