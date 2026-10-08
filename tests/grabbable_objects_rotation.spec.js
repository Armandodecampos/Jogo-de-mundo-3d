const { test, expect } = require('@playwright/test');

test.describe('Grabbable Objects Rotation Test', () => {
    test('Verify grabbable items (cesto, caixote, lenha, tronco cortado, pedra) are rotatable and include (T) Girar in rotatableItems', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true);

        const result = await page.evaluate(() => {
            const grabbableTypes = [
                'cesto_capim',
                'caixote',
                'lenha',
                'tronco_cortado',
                'pedra'
            ];

            const allInRotatable = grabbableTypes.every(type => window.rotatableItems.includes(type));

            const testResults = [];

            grabbableTypes.forEach((type, idx) => {
                const pos = new THREE.Vector3(idx * 2, 1, -2);
                let body = null;

                if (type === 'caixote') {
                    body = window.createBox(pos, new THREE.Quaternion());
                } else if (type === 'cesto_capim') {
                    body = window.createBasket(pos, new THREE.Quaternion());
                } else if (type === 'tronco_cortado') {
                    body = window.createCutTrunk(pos, null, new THREE.Quaternion());
                } else if (type === 'lenha') {
                    body = window.createFirewood(pos, null, new THREE.Quaternion());
                } else if (type === 'pedra') {
                    body = window.createPlaceableBlock(pos, new THREE.Quaternion(), 'pedra');
                    if (!body) {
                        body = window.collectibleBoxes.find(b => b.body.userData && b.body.userData.type === 'pedra')?.body;
                    }
                }

                if (!body) return;

                window.currentLookedAtBody = body;
                const beforeQuat = { x: body.quaternion.x, y: body.quaternion.y, z: body.quaternion.z, w: body.quaternion.w };

                window.rotateLookedAtObject();

                const afterQuat = { x: body.quaternion.x, y: body.quaternion.y, z: body.quaternion.z, w: body.quaternion.w };

                testResults.push({
                    type,
                    isRotatableInList: window.rotatableItems.includes(body.userData.type),
                    rotated: (beforeQuat.y !== afterQuat.y || beforeQuat.w !== afterQuat.w)
                });
            });

            return {
                allInRotatable,
                testResults
            };
        });

        expect(result.allInRotatable).toBe(true);
        expect(result.testResults.length).toBe(5);

        for (const res of result.testResults) {
            expect(res.isRotatableInList).toBe(true);
            expect(res.rotated).toBe(true);
        }
    });
});
