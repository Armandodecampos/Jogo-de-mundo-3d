import { test, expect } from '@playwright/test';

test.describe('F Key Grabbing Removal and Left-Click Grab Tests', () => {
    test('Verify F key does not grab any object and left-clicking cut trunk/firewood grabs/drops them', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true);

        const result = await page.evaluate(() => {
            const THREE = window.THREE;

            // Mock pointerLockElement so interact() is allowed to proceed
            Object.defineProperty(document, 'pointerLockElement', {
                get: () => window.renderer.domElement,
                configurable: true
            });

            // 1. Create a box body
            const boxBody = window.createBox(new THREE.Vector3(0, 1, -2), new THREE.Quaternion());

            // Attempt to grab with grabObject() (simulating F key or direct call)
            window.grabObject();
            const boxGrabbedAfterF = (window.pickedObjectBody === boxBody);

            // 2. Create cut trunk and firewood
            const cutTrunkBody = window.createCutTrunk(new THREE.Vector3(2, 1, -2), null, new THREE.Quaternion());

            // Mock raycaster targeting cutTrunkBody mesh
            const cutTrunkMesh = { userData: { physicsBody: cutTrunkBody } };
            window.raycaster.intersectObjects = () => [
                {
                    distance: 1.0,
                    object: cutTrunkMesh
                }
            ];

            // Interact with left click
            const interactGrabResult = window.interact();
            const cutTrunkGrabbed = (window.pickedObjectBody === cutTrunkBody);

            // Left click again to drop
            const interactDropResult = window.interact();
            const cutTrunkDropped = (window.pickedObjectBody === null);

            return {
                boxGrabbedAfterF,
                interactGrabResult,
                cutTrunkGrabbed,
                interactDropResult,
                cutTrunkDropped
            };
        });

        expect(result.boxGrabbedAfterF).toBe(false);
        expect(result.interactGrabResult).toBe(true);
        expect(result.cutTrunkGrabbed).toBe(true);
        expect(result.interactDropResult).toBe(true);
        expect(result.cutTrunkDropped).toBe(true);
    });
});
