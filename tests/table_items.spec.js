import { test, expect } from '@playwright/test';

test('Verify small table, wide table, and large table functionality and off-center placement', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    const result = await page.evaluate(async () => {
        const THREE = window.THREE;

        // Move player away so collision / raycasting tests aren't obstructed
        window.world.bodies[0].position.set(50, 10, 50);

        // 1. Check recipes and weights
        const wbRecipes = window.recipes.workbench;
        const hasSmallTableRecipe = wbRecipes.some(r => r.result.name === 'mesa_pequena');
        const hasWideTableRecipe = wbRecipes.some(r => r.result.name === 'mesa');
        const hasLargeTableRecipe = wbRecipes.some(r => r.result.name === 'mesa_grande');

        const smallWeight = window.itemWeights['mesa_pequena'];
        const wideWeight = window.itemWeights['mesa'];
        const largeWeight = window.itemWeights['mesa_grande'];

        if (!hasSmallTableRecipe || !hasWideTableRecipe || !hasLargeTableRecipe) {
            return { success: false, reason: 'Recipes missing for tables' };
        }

        // 2. Create tables in the world at ground surface Y = 0.8
        const posSmall = new THREE.Vector3(0, 0.8, 0);
        const posWide = new THREE.Vector3(5, 0.8, 0);
        const posLarge = new THREE.Vector3(10, 0.8, 0);

        const smallBody = window.createPlaceableBlock(posSmall, new THREE.Quaternion(), 'mesa_pequena');
        const wideBody = window.createPlaceableBlock(posWide, new THREE.Quaternion(), 'mesa');
        const largeBody = window.createPlaceableBlock(posLarge, new THREE.Quaternion(), 'mesa_grande');

        if (!smallBody || !wideBody || !largeBody) {
            return { success: false, reason: 'Failed to create table bodies' };
        }

        // Synchronize visual mesh positions
        [smallBody, wideBody, largeBody].forEach(b => {
            const idx = window.placedConstructionBodies.indexOf(b);
            const mesh = window.placedConstructionMeshes[idx];
            mesh.position.copy(b.position);
            mesh.quaternion.copy(b.quaternion);
            mesh.updateMatrixWorld();
        });

        window.updateRaycastTargets();

        // Check static physics and dimensions
        const smallShape = smallBody.shapes[0].halfExtents;
        const wideShape = wideBody.shapes[0].halfExtents;
        const largeShape = largeBody.shapes[0].halfExtents;

        const isSmallCorrect = Math.abs(smallShape.x - 0.4) < 0.01 && Math.abs(smallShape.y - 0.425) < 0.01 && Math.abs(smallShape.z - 0.4) < 0.01;
        const isWideCorrect = Math.abs(wideShape.x - 0.7) < 0.01 && Math.abs(wideShape.y - 0.425) < 0.01 && Math.abs(wideShape.z - 0.4) < 0.01;
        const isLargeCorrect = Math.abs(largeShape.x - 0.8) < 0.01 && Math.abs(largeShape.y - 0.425) < 0.01 && Math.abs(largeShape.z - 0.8) < 0.01;

        if (!isSmallCorrect || !isWideCorrect || !isLargeCorrect) {
            return { success: false, reason: 'Table dimensions incorrect' };
        }

        // 3. Test raycasting down and placing pestle ('pilão') at specific off-center coordinates on wide table
        // Wide table center at (5, 0.8, 0), top Y = 1.225.
        const testOffCenter = (tableBody, rayX, rayZ) => {
            const ray = new THREE.Raycaster(new THREE.Vector3(rayX, 3.0, rayZ), new THREE.Vector3(0, -1, 0));
            const intersects = ray.intersectObjects(window.raycastTargets, true);

            let intersectedBody = null;
            let currentObj = intersects[0].object;
            while (currentObj) {
                if (currentObj.userData && currentObj.userData.physicsBody) {
                    intersectedBody = currentObj.userData.physicsBody;
                    break;
                }
                currentObj = currentObj.parent;
            }

            const hitPoint = intersects[0].point;
            const hitNormal = intersects[0].face.normal.clone().transformDirection(intersects[0].object.matrixWorld).normalize();

            const targetHalfY = intersectedBody.shapes[0].halfExtents.y;
            const currentHalfY = 0.3 / 2; // pestle height (0.3) / 2 = 0.15

            const placementY = intersectedBody.position.y + targetHalfY + currentHalfY;
            const placementX = hitPoint.x;
            const placementZ = hitPoint.z;

            const pestleBody = window.createPlaceableBlock(new THREE.Vector3(placementX, placementY, placementZ), new THREE.Quaternion(), 'pilao');

            const tableTopY = tableBody.position.y + tableBody.shapes[0].halfExtents.y;
            const pestleBottomY = pestleBody.position.y - pestleBody.shapes[0].halfExtents.y;

            return {
                intersectedBodyIsTable: intersectedBody === tableBody,
                hitNormalY: hitNormal.y,
                pestleX: pestleBody.position.x,
                pestleZ: pestleBody.position.z,
                gap: Math.abs(pestleBottomY - tableTopY)
            };
        };

        const leftRes = testOffCenter(wideBody, 4.6, 0.2);
        const rightRes = testOffCenter(wideBody, 5.4, -0.2);

        return {
            success: true,
            smallWeight,
            wideWeight,
            largeWeight,
            smallStatic: smallBody.type === 2,
            wideStatic: wideBody.type === 2,
            largeStatic: largeBody.type === 2,
            leftRes,
            rightRes
        };
    });

    expect(result.success).toBe(true);
    expect(result.smallWeight).toBe(6.0);
    expect(result.wideWeight).toBe(10.0);
    expect(result.largeWeight).toBe(16.0);
    expect(result.smallStatic).toBe(true);
    expect(result.wideStatic).toBe(true);
    expect(result.largeStatic).toBe(true);

    expect(result.leftRes.intersectedBodyIsTable).toBe(true);
    expect(result.leftRes.hitNormalY).toBe(1);
    expect(result.leftRes.pestleX).toBeCloseTo(4.6, 2);
    expect(result.leftRes.pestleZ).toBeCloseTo(0.2, 2);
    expect(result.leftRes.gap).toBeLessThan(0.001);

    expect(result.rightRes.intersectedBodyIsTable).toBe(true);
    expect(result.rightRes.hitNormalY).toBe(1);
    expect(result.rightRes.pestleX).toBeCloseTo(5.4, 2);
    expect(result.rightRes.pestleZ).toBeCloseTo(-0.2, 2);
    expect(result.rightRes.gap).toBeLessThan(0.001);
});
