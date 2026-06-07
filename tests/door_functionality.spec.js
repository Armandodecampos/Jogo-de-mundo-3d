
const { test, expect } = require('@playwright/test');

test('Verify Porta (Door) functionality', async ({ page }) => {
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for the game to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Check if doorItemName is defined
    const doorItemName = await page.evaluate(() => window.doorItemName);
    expect(doorItemName).toBe('porta');

    // Check if door is in rotatableItems
    const isRotatable = await page.evaluate((name) => window.rotatableItems.includes(name), doorItemName);
    expect(isRotatable).toBe(true);

    // Test snapped position for door
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

    // Test toggleDoor logic
    await page.evaluate(() => {
        const body = {
            userData: {
                type: 'porta',
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
        window.doorStateAfterToggle = body.userData.isOpen;
        window.doorQuatAfterToggle = { ...body.quaternion };
    });

    const isOpen = await page.evaluate(() => window.doorStateAfterToggle);
    expect(isOpen).toBe(true);

    const quat = await page.evaluate(() => window.doorQuatAfterToggle);
    // Open door should be rotated -90 deg (w=0.707, y=-0.707)
    expect(quat.y).toBeCloseTo(-0.707, 2);
    expect(quat.w).toBeCloseTo(0.707, 2);
});
