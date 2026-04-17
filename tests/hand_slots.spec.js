const { test, expect } = require('@playwright/test');

test('Hand slots selection with 1 and 2', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Directly set selectedSlotIndex via page.evaluate
    await page.evaluate(() => {
        window.selectedSlotIndex = 1;
        window.updateBeltDisplay();
    });

    let selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
    expect(selectedSlot).toBe(1);

    // Now test if keys work by triggering them manually in the page context
    await page.evaluate(() => {
        const event1 = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event1);
    });

    selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
    expect(selectedSlot).toBe(0);

    await page.evaluate(() => {
        const event2 = new KeyboardEvent('keydown', { key: '2' });
        window.dispatchEvent(event2);
    });

    selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
    expect(selectedSlot).toBe(1);

    // Verify 'q' and 'e' no longer work
    await page.evaluate(() => {
        const eventQ = new KeyboardEvent('keydown', { key: 'q' });
        window.dispatchEvent(eventQ);
    });
    selectedSlot = await page.evaluate(() => window.selectedSlotIndex);
    expect(selectedSlot).toBe(1); // Should still be 1
});

test('UI labels for hand slots are 1 and 2', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    const slotKeyBinds = await page.locator('.slot-key-bind').allTextContents();
    expect(slotKeyBinds).toContain('1');
    expect(slotKeyBinds).toContain('2');
    expect(slotKeyBinds).not.toContain('Q');
    expect(slotKeyBinds).not.toContain('E');
});
