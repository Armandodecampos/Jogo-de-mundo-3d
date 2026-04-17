const { test, expect } = require('@playwright/test');

test('Hand slots selection with 1 through 9', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Test selection of all 9 slots
    for (let i = 1; i <= 9; i++) {
        await page.evaluate((slot) => {
            const event = new KeyboardEvent('keydown', { key: slot.toString() });
            window.dispatchEvent(event);
        }, i);

        const selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
        expect(selectedSlot).toBe(i - 1);
    }
});

test('UI labels for hand slots are 1 through 9', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    const slotKeyBinds = await page.locator('.slot-key-bind').allTextContents();
    for (let i = 1; i <= 9; i++) {
        expect(slotKeyBinds).toContain(i.toString());
    }
    expect(slotKeyBinds.length).toBe(9);
});

test('Empty hand slots do not show hand image', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    // Get all images in belt slots
    const beltImagesCount = await page.locator('#inventoryBelt .slot .slot-icon').count();

    const beltItems = await page.evaluate(() => window.beltItems);
    let expectedImages = 0;
    for (const item of beltItems) {
        if (item) expectedImages++;
    }

    expect(beltImagesCount).toBe(expectedImages);
});

test('Mouse wheel selection', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    // Initial slot should be 0
    let selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
    expect(selectedSlot).toBe(0);

    // Wheel down -> next slot (1)
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
    selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
    expect(selectedSlot).toBe(1);

    // Wheel up -> previous slot (0)
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(100);
    selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
    expect(selectedSlot).toBe(0);

    // Wheel up again -> wrap to 8
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(100);
    selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
    expect(selectedSlot).toBe(8);
});

test('Solid background for belt and slots', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    const beltBg = await page.evaluate(() => {
        const el = document.getElementById('inventoryBelt');
        return window.getComputedStyle(el).backgroundColor;
    });
    // 'rgba(0, 0, 0, 0)' or 'transparent' for the belt container
    expect(beltBg === 'rgba(0, 0, 0, 0)' || beltBg === 'transparent').toBe(true);

    const slotBg = await page.evaluate(() => {
        const el = document.querySelector('.slot');
        return window.getComputedStyle(el).backgroundColor;
    });
    // #333 is rgb(51, 51, 51)
    expect(slotBg).toBe('rgb(51, 51, 51)');
});
