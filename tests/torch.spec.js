const { test, expect } = require('@playwright/test');

test('Torch item exists and can be held', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Give torch to player and select it
    await page.evaluate(() => {
        window.addItemToInventory(window.beltItems, { name: 'tocha', quantity: 10 });
        const torchIdx = window.beltItems.findIndex(item => item && item.name === 'tocha');
        if (torchIdx !== -1) {
            window.selectedSlotIndex = torchIdx;
        }
        window.updateUI();
    });

    await page.waitForTimeout(1000);

    // Verify heldTorchGroup is visible
    const isHeldTorchVisible = await page.evaluate(() => {
        return window.heldTorchGroup && window.heldTorchGroup.visible;
    });
    expect(isHeldTorchVisible).toBe(true);
});

test('Torch item can be placed', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Give torch to player and select it
    await page.evaluate(() => {
        window.addItemToInventory(window.beltItems, { name: 'tocha', quantity: 10 });
        const torchIdx = window.beltItems.findIndex(item => item && item.name === 'tocha');
        if (torchIdx !== -1) {
            window.selectedSlotIndex = torchIdx;
        }
        window.updateUI();
    });

    await page.waitForTimeout(500);

    // Force place torch via direct function call for testing
    await page.evaluate(() => {
        const pos = new window.THREE.Vector3(0, window.getSurfaceHeight(0, -2) + 0.4, -2);
        const quat = new window.THREE.Quaternion();
        window.createPlaceableBlock(pos, quat, 'tocha');
    });

    await page.waitForTimeout(1000);

    // Check if a torch was added to activeCampfires
    const hasPlacedTorch = await page.evaluate(() => {
        return window.activeCampfires && window.activeCampfires.some(cf => cf.userData.type === 'tocha');
    });
    expect(hasPlacedTorch).toBe(true);
});
