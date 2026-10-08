const { test, expect } = require('@playwright/test');

test.describe('Placed Object Diagonal Rotation', () => {
    test('Verify rotating placed object in the world rotates in 45 degree increments', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true);

        const debug = await page.evaluate(() => {
            const rotatableType = window.rotatableItems[0]; // e.g. 'cama'
            const pos = new THREE.Vector3(0, 1, -2);
            window.createPlaceableBlock(pos, new THREE.Quaternion(), rotatableType);
            const createdBody = window.placedConstructionBodies[window.placedConstructionBodies.length - 1];

            const initialType = createdBody.userData ? createdBody.userData.type : null;
            const isRotatable = window.rotatableItems.includes(initialType);

            window.currentLookedAtBody = createdBody;
            const beforeQuat = { x: createdBody.quaternion.x, y: createdBody.quaternion.y, z: createdBody.quaternion.z, w: createdBody.quaternion.w };

            window.rotateLookedAtObject();

            const afterQuat1 = { x: createdBody.quaternion.x, y: createdBody.quaternion.y, z: createdBody.quaternion.z, w: createdBody.quaternion.w };

            window.currentLookedAtBody = createdBody;
            window.rotateLookedAtObject();

            const afterQuat2 = { x: createdBody.quaternion.x, y: createdBody.quaternion.y, z: createdBody.quaternion.z, w: createdBody.quaternion.w };

            return {
                initialType,
                isRotatable,
                beforeQuat,
                afterQuat1,
                afterQuat2
            };
        });

        console.log('DEBUG ROTATION:', JSON.stringify(debug, null, 2));

        const euler1 = await page.evaluate((q) => new THREE.Euler().setFromQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w), 'YXZ').y, debug.afterQuat1);
        const euler2 = await page.evaluate((q) => new THREE.Euler().setFromQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w), 'YXZ').y, debug.afterQuat2);

        expect(euler1).toBeCloseTo(Math.PI / 4, 3);
        expect(euler2).toBeCloseTo(Math.PI / 2, 3);
    });
});
