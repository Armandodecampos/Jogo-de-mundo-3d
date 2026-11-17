const { test, expect } = require('@playwright/test');

test.describe('Birds', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
    });

    test('birds have colorful anatomy and can land on world objects', async ({ page }) => {
        const result = await page.evaluate(() => {
            const testBird = window.createBirdMesh();
            const geometryTypes = new Set();
            const colors = new Set();
            testBird.traverse(object => {
                if (!object.isMesh) return;
                geometryTypes.add(object.geometry.type);
                colors.add(object.material.color.getHex());
            });

            const originalRandom = Math.random;
            const existingBirds = new Set(window.birds);
            const cameraPosition = window.camera.position;
            const perchBody = {
                position: new THREE.Vector3(
                    cameraPosition.x,
                    window.getSurfaceHeight(cameraPosition.x, cameraPosition.z) + 0.5,
                    cameraPosition.z
                ),
                userData: { dimensions: { width: 2, height: 1, depth: 2 } }
            };
            window.placedConstructionBodies.push(perchBody);

            try {
                let randomCalls = 0;
                Math.random = () => ++randomCalls === 4 ? 0.5 : 0;
                window.spawnBirdGroup();
                const spawnedBird = window.birds.find(bird => !existingBirds.has(bird));
                const targetWasSelected = spawnedBird?.perchTargetBody === perchBody;

                if (spawnedBird) {
                    spawnedBird.mesh.position.set(
                        cameraPosition.x,
                        perchBody.position.y + perchBody.userData.dimensions.height / 2 + 0.48,
                        cameraPosition.z
                    );
                    window.updateBirds(0.016, 100000);
                }

                return {
                    geometryTypes: Array.from(geometryTypes),
                    colorCount: colors.size,
                    targetWasSelected,
                    landed: spawnedBird?.state === 'perched',
                    landedHeight: spawnedBird?.mesh.position.y,
                    expectedHeight: perchBody.position.y + perchBody.userData.dimensions.height / 2 + 0.28
                };
            } finally {
                Math.random = originalRandom;
                window.scene.remove(testBird);
                window.birds.slice().forEach(bird => {
                    if (!existingBirds.has(bird)) {
                        window.scene.remove(bird.mesh);
                        window.birds.splice(window.birds.indexOf(bird), 1);
                    }
                });
                window.placedConstructionBodies.splice(window.placedConstructionBodies.indexOf(perchBody), 1);
            }
        });

        expect(result.geometryTypes).toContain('SphereGeometry');
        expect(result.geometryTypes).toContain('ShapeGeometry');
        expect(result.geometryTypes).toContain('ConeGeometry');
        expect(result.colorCount).toBeGreaterThanOrEqual(3);
        expect(result.targetWasSelected).toBe(true);
        expect(result.landed).toBe(true);
        expect(result.landedHeight).toBeCloseTo(result.expectedHeight, 5);
    });
});
