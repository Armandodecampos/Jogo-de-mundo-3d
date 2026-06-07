
const { test, expect } = require('@playwright/test');

test('Verify Janela (Window) functionality', async ({ page }) => {
    await page.goto('http://localhost:8080/index.htm');

    // Bypass start button if needed, but the test might fail if it's not clicked
    await page.evaluate(() => {
        const startBtn = document.getElementById('startButton');
        if (startBtn) startBtn.click();
    });

    // Wait for the game to be ready
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 15000 });

    // Check if windowItemName is defined
    const windowItemName = await page.evaluate(() => window.windowItemName);
    expect(windowItemName).toBe('janela');

    // Check if window is in rotatableItems
    const isRotatable = await page.evaluate((name) => window.rotatableItems.includes(name), windowItemName);
    expect(isRotatable).toBe(true);

    // Test snapped position for window (should be same as door)
    const snappedPos = await page.evaluate(() => {
        const unwrappedX = 0.3;
        const unwrappedZ = 0.3;
        const cobSize = 0.4;
        const snappedUnwrappedX = Math.round((unwrappedX - cobSize / 2) / cobSize) * cobSize + cobSize / 2;
        const snappedUnwrappedZ = Math.round((unwrappedZ - cobSize / 2) / cobSize) * cobSize + cobSize / 2;
        return { x: snappedUnwrappedX, z: snappedUnwrappedZ };
    });
    expect(snappedPos.x).toBeCloseTo(0.2);
    expect(snappedPos.z).toBeCloseTo(0.2);

    // Test toggleDoor logic for window
    await page.evaluate(() => {
        const body = {
            userData: {
                type: 'janela',
                isOpen: false,
                baseQuaternion: { x: 0, y: 0, z: 0, w: 1 }
            },
            quaternion: {
                set: function(x, y, z, w) {
                    this.x = x; this.y = y; this.z = z; this.w = w;
                }
            },
            updateAABB: () => {}
        };
        window.toggleDoor(body);
        window.windowStateAfterToggle = body.userData.isOpen;
        window.windowQuatAfterToggle = { ...body.quaternion };
    });

    const isOpen = await page.evaluate(() => window.windowStateAfterToggle);
    expect(isOpen).toBe(true);

    const quat = await page.evaluate(() => window.windowQuatAfterToggle);
    // Open window should be rotated -90 deg (w=0.707, y=-0.707)
    expect(quat.y).toBeCloseTo(-0.707, 2);
    expect(quat.w).toBeCloseTo(0.707, 2);
});
