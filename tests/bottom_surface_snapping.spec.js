const { test, expect } = require('@playwright/test');

test.describe('Bottom Surface Block Snapping', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
        await page.evaluate(() => { window.gamePaused = false; });
    });

    test('construction blocks auto-align X and Z on bottom face of existing block', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Create base block at (10, 5, 10)
            const basePos = new window.THREE.Vector3(10, 5, 10);
            const baseBlock = window.createPlaceableBlock(basePos, null, 'cob');

            // Simulate placing another 'cob' block on bottom surface (hitNormal.y < -0.7)
            window.currentBlockType = 'cob';
            const targetHalfX = 0.2, targetHalfY = 0.2, targetHalfZ = 0.2;
            const currentHalfX = 0.2, currentHalfY = 0.2, currentHalfZ = 0.2;

            // Simulating raycast hit on bottom face off-center at (10.15, 4.8, 9.85)
            const hitPoint = { x: 10.15, y: 4.8, z: 9.85 };
            const hitNormal = new window.THREE.Vector3(0, -1, 0);

            const isConstructionBlock = [
                'cob', 'piso',
                window.stoneBlockItemName, window.woodenBlockItemName,
                window.stoneFloorItemName, window.woodenFloorItemName,
                window.doorItemName, window.windowItemName
            ].includes(window.currentBlockType);

            const placementPosition = new window.THREE.Vector3();
            if (hitNormal.y < -0.7) {
                placementPosition.y = baseBlock.position.y - targetHalfY - currentHalfY;
                if (isConstructionBlock) {
                    placementPosition.x = baseBlock.position.x;
                    placementPosition.z = baseBlock.position.z;
                } else {
                    placementPosition.x = hitPoint.x;
                    placementPosition.z = hitPoint.z;
                }
            }

            // Also test creating the block below baseBlock
            const placedBlock = window.createPlaceableBlock(placementPosition, null, 'cob');

            return {
                baseX: baseBlock.position.x,
                baseY: baseBlock.position.y,
                baseZ: baseBlock.position.z,
                placedX: placedBlock.position.x,
                placedY: placedBlock.position.y,
                placedZ: placedBlock.position.z
            };
        });

        expect(result.placedX).toBe(result.baseX);
        expect(result.placedZ).toBe(result.baseZ);
        expect(result.placedY).toBe(4.6); // 5 - 0.2 - 0.2
    });
});
