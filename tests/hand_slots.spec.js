const { test, expect } = require('@playwright/test');

test('Hand slots selection with 1 through 9', async ({ page }) => {
    test.setTimeout(60000);
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

    // Since initially slots might be empty (except maybe some starting items, but belt usually starts empty or with one item)
    // The key is that "empty" slots should NOT have an <img> with slot-icon class if they don't have an item.
    // Actually, in my change, if there's no item, no img is created for 'belt' type.

    const beltItems = await page.evaluate(() => window.beltItems);
    let expectedImages = 0;
    for (const item of beltItems) {
        if (item) expectedImages++;
    }

    expect(beltImagesCount).toBe(expectedImages);
});
