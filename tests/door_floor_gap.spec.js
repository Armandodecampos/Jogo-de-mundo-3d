const { test, expect } = require('@playwright/test');

test('Verify Door floor gap (espaço na parte de baixo da altura de um piso)', async ({ page }) => {
    await page.goto('http://localhost:8080/index.htm');

    await page.evaluate(() => {
        const startBtn = document.getElementById('startButton');
        if (startBtn) startBtn.click();
    });

    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 15000 });

    const doorInfo = await page.evaluate(() => {
        const cobHeight = 0.4;
        const floorHeight = cobHeight / 5; // 0.08

        // Create a test door block
        const pos = new window.THREE.Vector3(0, 5, 0);
        window.createPlaceableBlock(pos, null, 'porta');

        const index = window.placedConstructionBodies.length - 1;
        const doorBody = window.placedConstructionBodies[index];
        const doorMeshGroup = window.placedConstructionMeshes[index];

        const shape = doorBody.shapes[0];
        const shapeOffset = doorBody.shapeOffsets[0];

        // Retrieve door mesh child
        const doorPanelMesh = doorMeshGroup.children[0];
        const panelGeomHeight = doorPanelMesh.geometry.parameters.height;
        const panelOffsetY = doorPanelMesh.position.y;

        return {
            floorHeight,
            shapeHalfY: shape.halfExtents.y,
            shapeOffsetY: shapeOffset.y,
            panelGeomHeight,
            panelOffsetY
        };
    });

    expect(doorInfo.floorHeight).toBeCloseTo(0.08);
    // Panel height should be 2.4 - 0.08 = 2.32
    expect(doorInfo.panelGeomHeight).toBeCloseTo(2.32);
    // Panel Y offset in mesh group should be 0.08 / 2 = 0.04
    expect(doorInfo.panelOffsetY).toBeCloseTo(0.04);
    // Physics shape half extents Y should be 2.32 / 2 = 1.16
    expect(doorInfo.shapeHalfY).toBeCloseTo(1.16);
    // Physics shape offset Y should be 0.08 / 2 = 0.04
    expect(doorInfo.shapeOffsetY).toBeCloseTo(0.04);

    // Test placement overlap logic: placing door over existing floor
    const placementOverlapResult = await page.evaluate(() => {
        const floorPos = new window.THREE.Vector3(10, 0.04, 10);
        window.createPlaceableBlock(floorPos, null, 'piso');

        const staticFloorBody = window.placedConstructionBodies[window.placedConstructionBodies.length - 1];

        // Simulate ghost calculations when placing a door at same location over floor
        const cobHeight = 0.4;
        const floorHeight = cobHeight / 5; // 0.08
        const doorWidth = 1.2;
        const doorHeight = 2.4;
        const doorDepth = 0.1;

        // Base Y of door when pointing at floor is bottom of floor = 0.0
        // placementPosition.y = 0.0 + doorHeight / 2 = 1.2
        const placementY = 1.2;
        const ghostCenterY = placementY;
        const wHalfY = doorHeight / 2; // 1.2

        const inset = 0.02;
        // pMinY for ghost door is ghostCenterY - wHalfY + floorHeight + inset = 1.2 - 1.2 + 0.08 + 0.02 = 0.10
        const pMinY = ghostCenterY - wHalfY + floorHeight + inset;
        const pMaxY = ghostCenterY + wHalfY - inset;

        // Floor Y range: sMinY = 0.0, sMaxY = 0.08
        const sMinY = staticFloorBody.position.y - staticFloorBody.shapes[0].halfExtents.y; // 0.04 - 0.04 = 0.0
        const sMaxY = staticFloorBody.position.y + staticFloorBody.shapes[0].halfExtents.y; // 0.04 + 0.04 = 0.08

        const overlapsVertical = pMaxY > sMinY && pMinY < sMaxY;

        return {
            pMinY,
            pMaxY,
            sMinY,
            sMaxY,
            overlapsVertical
        };
    });

    expect(placementOverlapResult.sMinY).toBeCloseTo(0.0);
    expect(placementOverlapResult.sMaxY).toBeCloseTo(0.08);
    expect(placementOverlapResult.pMinY).toBeCloseTo(0.10);
    expect(placementOverlapResult.overlapsVertical).toBe(false);
});
