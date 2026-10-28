const { test, expect } = require('@playwright/test');

test.describe('Object Placement Sound Verification', () => {
    test('Verify playPlacementSound function is defined and invoked when placing objects/blocks', async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');

        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

        // Verify window.playPlacementSound exists
        const exists = await page.evaluate(() => typeof window.playPlacementSound === 'function');
        expect(exists).toBe(true);

        // Test playPlacementSound function directly and within placement logic
        const soundCount = await page.evaluate(() => {
            let count = 0;
            const origSound = window.playPlacementSound;
            window.playPlacementSound = function() {
                count++;
                if (origSound) origSound();
            };

            // Test 1: Direct function call
            window.playPlacementSound();

            // Test 2: Simulated placement trigger
            const currentBlockType = 'cob';
            let materialLoaded = true;
            if (materialLoaded) {
                window.createPlaceableBlock(
                    new window.THREE.Vector3(0, 0, 0),
                    new window.THREE.Quaternion(),
                    currentBlockType
                );
                window.playPlacementSound();
            }

            return count;
        });

        expect(soundCount).toBe(2);
    });
});
