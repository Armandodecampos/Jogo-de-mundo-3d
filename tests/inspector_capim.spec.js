const { test, expect } = require('@playwright/test');

test.describe('Inspector Capim Detection', () => {
    test('should detect Capim when aimed at grass cluster', async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true);

        // Mock pointerLockElement so main raycast in animate() runs
        await page.evaluate(() => {
            Object.defineProperty(document, 'pointerLockElement', { get: () => window.renderer.domElement, configurable: true });
            window.useInspector = true;
        });

        // Find a capim cluster near the island center and point camera directly at it
        const detected = await page.evaluate(() => {
            if (!window.capimClusters || window.capimClusters.length === 0) return false;
            // Pick a cluster close to island center (0,0) to avoid water
            const cluster = window.capimClusters.find(c => {
                const distSq = c.position.x * c.position.x + c.position.z * c.position.z;
                return distSq < 400; // within 20m of center
            }) || window.capimClusters[0];

            // Position player near cluster and look at cluster center
            window.playerBody.position.set(cluster.position.x, cluster.position.y + 1.6, cluster.position.z + 0.8);
            const targetPos = new window.THREE.Vector3(cluster.position.x, cluster.position.y + 0.1, cluster.position.z);
            window.camera.position.copy(window.playerBody.position);
            window.camera.lookAt(targetPos);
            window.camera.updateMatrixWorld();
            window.camera.matrixWorldInverse.copy(window.camera.matrixWorld).invert();
            return true;
        });

        expect(detected).toBe(true);
        await page.waitForTimeout(500);

        // Check interaction hint element
        const hintText = await page.evaluate(() => {
            const el = document.getElementById('interactionHint');
            return el ? el.textContent : '';
        });

        console.log('Hint text:', hintText);
        expect(hintText).toContain('Capim');
    });
});
