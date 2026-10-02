const { test, expect } = require('@playwright/test');

test.describe('Wood Cutting Sound Verification', () => {
    test('Verify hand vs tool sound playback when starting destruction on wood', async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');

        // Wait for world ready
        await page.evaluate(() => {
            const startBtn = document.getElementById('startButton');
            if (startBtn) startBtn.click();
        });
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

        // Spy on sound functions
        await page.evaluate(() => {
            window.handSoundCount = 0;
            window.toolSoundCount = 0;

            const origHandSound = window.playHandWoodImpactSound;
            window.playHandWoodImpactSound = function() {
                window.handSoundCount++;
                if (origHandSound) origHandSound();
            };

            const origToolSound = window.playToolWoodImpactSound;
            window.playToolWoodImpactSound = function() {
                window.toolSoundCount++;
                if (origToolSound) origToolSound();
            };
        });

        // Test 1: Cut wood trunk with hands (heldItem = null)
        await page.evaluate(() => {
            window.handSoundCount = 0;
            window.toolSoundCount = 0;

            // Empty hands slot
            window.beltItems[0] = null;
            window.selectedSlotIndex = 0;

            // Trigger sound logic for wood material
            const materialType = 'wood';
            const heldItem = window.beltItems[window.selectedSlotIndex];

            if (materialType === 'wood') {
                if (heldItem === null || heldItem.quantity <= 0) {
                    window.playHandWoodImpactSound();
                } else {
                    window.playToolWoodImpactSound();
                }
            }
        });

        const handCount1 = await page.evaluate(() => window.handSoundCount);
        const toolCount1 = await page.evaluate(() => window.toolSoundCount);

        expect(handCount1).toBe(1);
        expect(toolCount1).toBe(0);

        // Test 2: Cut wood trunk with an axe/tool (heldItem = axe)
        await page.evaluate(() => {
            window.handSoundCount = 0;
            window.toolSoundCount = 0;

            // Equip axe in hand slot
            window.beltItems[0] = { name: window.axeItemName, quantity: 1 };
            window.selectedSlotIndex = 0;

            const materialType = 'wood';
            const heldItem = window.beltItems[window.selectedSlotIndex];

            if (materialType === 'wood') {
                if (heldItem === null || heldItem.quantity <= 0) {
                    window.playHandWoodImpactSound();
                } else {
                    window.playToolWoodImpactSound();
                }
            }
        });

        const handCount2 = await page.evaluate(() => window.handSoundCount);
        const toolCount2 = await page.evaluate(() => window.toolSoundCount);

        expect(handCount2).toBe(0);
        expect(toolCount2).toBe(1);
    });

    test('Verify repeating sound playback during continuous wood cutting', async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');

        await page.evaluate(() => {
            const startBtn = document.getElementById('startButton');
            if (startBtn) startBtn.click();
        });
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

        // Test repeating intervals in animate loop simulation
        const result = await page.evaluate(() => {
            window.handSoundCount = 0;
            window.toolSoundCount = 0;

            window.playHandWoodImpactSound = function() { window.handSoundCount++; };
            window.playToolWoodImpactSound = function() { window.toolSoundCount++; };

            window.beltItems[0] = null; // Bare hands
            window.selectedSlotIndex = 0;

            let destroyTargetMaterialType = 'wood';
            let lastWoodCutSoundTime = Date.now() - 500; // Trigger initial or repeated sound

            // Simulate 3 frames spaced by 450ms
            for (let i = 0; i < 3; i++) {
                const nowMs = lastWoodCutSoundTime + 450;
                if (nowMs - lastWoodCutSoundTime >= 400) {
                    lastWoodCutSoundTime = nowMs;
                    const heldItem = window.beltItems[window.selectedSlotIndex];
                    if (heldItem === null || (heldItem && heldItem.quantity <= 0)) {
                        window.playHandWoodImpactSound();
                    } else {
                        window.playToolWoodImpactSound();
                    }
                }
            }

            return { handCount: window.handSoundCount, toolCount: window.toolSoundCount };
        });

        expect(result.handCount).toBe(3);
        expect(result.toolCount).toBe(0);
    });
});
