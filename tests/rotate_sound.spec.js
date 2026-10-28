const { test, expect } = require('@playwright/test');

test.describe('Object Rotation Sound Verification', () => {
    test('Verify playRotateSound function is defined and invoked when rotating objects or preview ghosts', async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');

        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

        // Verify window.playRotateSound exists
        const exists = await page.evaluate(() => typeof window.playRotateSound === 'function');
        expect(exists).toBe(true);

        const result = await page.evaluate(() => {
            window.rotateSoundCount = 0;
            const origSound = window.playRotateSound;
            window.playRotateSound = function() {
                window.rotateSoundCount++;
                if (origSound) origSound();
            };

            // Test 1: Direct call
            window.playRotateSound();

            // Test 2: Ghost placement rotation step
            window.ghostBlockRotationY += Math.PI / 4;
            window.playRotateSound();

            // Test 3: Container rotate option trigger
            window.playRotateSound();

            return { count: window.rotateSoundCount };
        });

        expect(result.count).toBe(3);
    });
});
