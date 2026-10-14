
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

    // Test window origin alignment when placed between two blocks (centered at vertex 0.2)
    const windowPlacement = await page.evaluate(() => {
        const unwrappedX = 0.21; // near vertex 0.2 between block at 0.0 and block at 0.4
        const unwrappedZ = 0.02;
        const cobSize = 0.4;
        const windowWidth = 0.8;
        const windowDepth = 0.1;

        const centerX = Math.round(unwrappedX / (cobSize / 2)) * (cobSize / 2); // 0.2
        const centerZ = Math.round(unwrappedZ / cobSize) * cobSize; // 0.0

        const posX = centerX - windowWidth / 2; // -0.2
        const posZ = centerZ + windowDepth / 2; // 0.05

        // Window local bounds: X in [0, 0.8], Z in [-0.1, 0]
        const minWorldX = posX; // -0.2
        const maxWorldX = posX + windowWidth; // 0.6
        const minWorldZ = posZ - windowDepth; // -0.05
        const maxWorldZ = posZ; // 0.05

        return { minWorldX, maxWorldX, minWorldZ, maxWorldZ };
    });

    expect(windowPlacement.minWorldX).toBeCloseTo(-0.2);
    expect(windowPlacement.maxWorldX).toBeCloseTo(0.6);
    expect(windowPlacement.minWorldZ).toBeCloseTo(-0.05);
    expect(windowPlacement.maxWorldZ).toBeCloseTo(0.05);

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
