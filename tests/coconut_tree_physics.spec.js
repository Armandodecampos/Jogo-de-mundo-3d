import { test, expect } from '@playwright/test';

test('mature coconut trees keep collision active near their trunk and can be climbed', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

    const treeState = await page.evaluate(async () => {
        const groundY = window.getSurfaceHeight(0, 0);
        const tree = window.createPlaceableBlock(
            new window.THREE.Vector3(0, groundY, 0),
            null,
            window.coconutSeedItemName,
            'arvore_adulta'
        );
        const treeMesh = window.placedConstructionMeshes[
            window.placedConstructionBodies.indexOf(tree)
        ];
        const playerRadius = 0.87;
        const treeBottom = tree.position.y - tree.userData.dimensions.height / 2;
        window.playerBody.position.set(3, treeBottom + playerRadius + 0.1, 0);
        window.playerBody.velocity.set(0, 0, 0);
        window.world.removeBody(tree);
        window.updateRaycastTargets();

        await new Promise(resolve => setTimeout(resolve, 200));
        const collisionActiveNearTrunk = tree.world === window.world;
        const includedInRaycastTargets = window.raycastTargets.includes(treeMesh);

        window.raycaster.intersectObjects = () => [{
            distance: 1,
            object: treeMesh
        }];

        return {
            collisionShapeCount: tree.shapes.length,
            collisionActiveNearTrunk,
            includedInRaycastTargets
        };
    });

    expect(treeState.collisionShapeCount).toBeGreaterThan(0);
    expect(treeState.collisionActiveNearTrunk).toBe(true);
    expect(treeState.includedInRaycastTargets).toBe(true);
    await page.keyboard.press('p');
    await expect.poll(() => page.evaluate(() => window.isClimbing)).toBe(true);
});
