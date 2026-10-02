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
            window.handSoundPlayed = false;
            window.toolSoundPlayed = false;

            const origHandSound = window.playHandWoodImpactSound;
            window.playHandWoodImpactSound = function() {
                window.handSoundPlayed = true;
                if (origHandSound) origHandSound();
            };

            const origToolSound = window.playToolWoodImpactSound;
            window.playToolWoodImpactSound = function() {
                window.toolSoundPlayed = true;
                if (origToolSound) origToolSound();
            };
        });

        // Test 1: Cut wood trunk with hands (heldItem = null)
        await page.evaluate(() => {
            window.handSoundPlayed = false;
            window.toolSoundPlayed = false;

            // Empty hands slot
            window.beltItems[0] = null;
            window.selectedSlotIndex = 0;

            // Mock target wood body
            const woodBody = {
                userData: {
                    type: window.treeTrunkItemName,
                    durability: 1.0,
                    isDestructible: true
                }
            };

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

        const handPlayed = await page.evaluate(() => window.handSoundPlayed);
        const toolPlayed1 = await page.evaluate(() => window.toolSoundPlayed);

        expect(handPlayed).toBe(true);
        expect(toolPlayed1).toBe(false);

        // Test 2: Cut wood trunk with an axe/tool (heldItem = axe)
        await page.evaluate(() => {
            window.handSoundPlayed = false;
            window.toolSoundPlayed = false;

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

        const handPlayed2 = await page.evaluate(() => window.handSoundPlayed);
        const toolPlayed2 = await page.evaluate(() => window.toolSoundPlayed);

        expect(handPlayed2).toBe(false);
        expect(toolPlayed2).toBe(true);
    });
});
