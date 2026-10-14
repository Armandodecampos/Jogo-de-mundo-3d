import { test, expect } from '@playwright/test';

test('Window placement between two adjacent blocks', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('file://' + process.cwd() + '/index.htm');

    // Start game
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    // Setup two adjacent blocks and test window ghost snapping on top
    const placementData = await page.evaluate(() => {
        const THREE = window.THREE;

        // Create block 1 at (0, 0.8, -3)
        const block1Pos = new THREE.Vector3(0, 0.8, -3);
        window.createPlaceableBlock(block1Pos, null, window.woodenBlockItemName);

        // Create block 2 at (0.4, 0.8, -3) - adjacent along X axis
        const block2Pos = new THREE.Vector3(0.4, 0.8, -3);
        window.createPlaceableBlock(block2Pos, null, window.woodenBlockItemName);

        // Update raycast targets
        window.updateRaycastTargets();

        // Equip window in belt slot 0
        window.beltItems[0] = { name: window.windowItemName, quantity: 10 };
        window.selectedSlotIndex = 0;
        window.updateBeltDisplay();

        // Position player looking at the middle top between block 1 and block 2
        window.world.bodies.forEach(b => {
            if (b === window.playerBody) {
                b.position.set(0.2, 1.8, -1.0);
            }
        });
        window.camera.position.set(0.2, 1.8, -1.0);
        window.camera.lookAt(new THREE.Vector3(0.2, 1.0, -3.0));

        // Trigger animate loop to calculate ghost position
        window.animate();

        return {
            ghostVisible: window.ghostBlockMesh.visible,
            ghostPos: {
                x: window.ghostBlockMesh.position.x,
                y: window.ghostBlockMesh.position.y,
                z: window.ghostBlockMesh.position.z
            },
            ghostColor: window.ghostBlockMesh.material.color.getHex()
        };
    });

    console.log('Placement result:', placementData);

    expect(placementData.ghostVisible).toBe(true);
    // Block top Y is 0.8 + 0.2 = 1.0. Window height is 0.8, half height is 0.4. Center Y should be 1.0 + 0.4 = 1.4.
    expect(placementData.ghostPos.y).toBeCloseTo(1.4, 2);

    // Place window and capture screenshot
    await page.evaluate(() => {
        window.placeBlock(window.beltItems[0], 0);
    });

    await page.screenshot({ path: 'window_two_blocks_placement.png' });
});
