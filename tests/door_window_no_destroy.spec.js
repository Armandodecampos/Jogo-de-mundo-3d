const { test, expect } = require('@playwright/test');

test.describe('Door and Window Destruction Immunity', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true);
    });

    test('doors and windows should have isDestructible set to false', async ({ page }) => {
        const destructibleInfo = await page.evaluate(() => {
            const doorBody = window.createPlaceableBlock(new window.THREE.Vector3(0, 0, 0), null, 'porta');
            const windowBody = window.createPlaceableBlock(new window.THREE.Vector3(2, 0, 0), null, 'janela');
            return {
                doorIsDestructible: doorBody.userData.isDestructible,
                windowIsDestructible: windowBody.userData.isDestructible
            };
        });

        expect(destructibleInfo.doorIsDestructible).toBe(false);
        expect(destructibleInfo.windowIsDestructible).toBe(false);
    });

    test('left-clicking a door from beyond pickup distance should not trigger destruction or toggle', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Create a door at distance 4.0m (between pickUpDistance 3.0m and destroyDistance 5.0m)
            const doorBody = window.createPlaceableBlock(new window.THREE.Vector3(0, 0, 4), null, 'porta');
            const initialOpenState = doorBody.userData.isOpen;

            const doorMesh = window.placedConstructionMeshes[window.placedConstructionBodies.indexOf(doorBody)];
            const origIntersect = window.THREE.Raycaster.prototype.intersectObjects;
            window.THREE.Raycaster.prototype.intersectObjects = function() {
                return [{
                    distance: 4.0,
                    point: new window.THREE.Vector3(0, 0, 4),
                    object: doorMesh
                }];
            };

            try {
                window.startDestruction();
                return {
                    isOpenAfter: doorBody.userData.isOpen,
                    initialOpenState: initialOpenState,
                    isDestroying: window.isDestroying
                };
            } finally {
                window.THREE.Raycaster.prototype.intersectObjects = origIntersect;
            }
        });

        expect(result.isOpenAfter).toBe(result.initialOpenState); // State did not toggle
        expect(result.isDestroying).toBe(false); // Destruction did not start
    });

    test('left-clicking a door within pickup distance toggles door and does not trigger destruction', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Create a door at distance 2.0m (within pickUpDistance 3.0m)
            const doorBody = window.createPlaceableBlock(new window.THREE.Vector3(0, 0, 2), null, 'porta');
            const initialOpenState = doorBody.userData.isOpen;

            const doorMesh = window.placedConstructionMeshes[window.placedConstructionBodies.indexOf(doorBody)];
            const origIntersect = window.THREE.Raycaster.prototype.intersectObjects;
            window.THREE.Raycaster.prototype.intersectObjects = function() {
                return [{
                    distance: 2.0,
                    point: new window.THREE.Vector3(0, 0, 2),
                    object: doorMesh
                }];
            };

            try {
                window.startDestruction();
                return {
                    isOpenAfter: doorBody.userData.isOpen,
                    initialOpenState: initialOpenState,
                    isDestroying: window.isDestroying
                };
            } finally {
                window.THREE.Raycaster.prototype.intersectObjects = origIntersect;
            }
        });

        expect(result.isOpenAfter).toBe(!result.initialOpenState); // Toggled!
        expect(result.isDestroying).toBe(false); // Destruction did not start
    });
});
