const { test, expect } = require('@playwright/test');

test.describe('Birds', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
    });

    test('nest birds hide inside trees and flee when nearby terrain changes', async ({ page }) => {
        const result = await page.evaluate(() => {
            const tree = window.placedConstructionBodies.find(body =>
                body.userData?.growthStage === 'arvore_adulta' && body.userData.hasBirdNest
            );
            const bird = window.birds.find(candidate =>
                candidate.isNestBird && candidate.nestTreeBody === tree
            );
            const nestY = tree.position.y + tree.userData.randomizedDimensions.visual.leaves.yOffsetInGroup;
            const birdWasInsideNest = bird.state === 'perched' && !bird.mesh.visible &&
                Math.abs(bird.mesh.position.y - nestY) < 0.2 &&
                bird.mesh.position.y < tree.position.y + tree.userData.dimensions.height / 2;

            window.scareBirdsFromTerrainChange([{ position: tree.position.clone() }]);

            return {
                birdWasInsideNest,
                birdFled: bird.state === 'flying' && bird.mesh.visible,
                nestWasPreserved: bird.isNestBird && bird.nestTreeBody === tree &&
                    tree.userData.hasBirdNest,
                returnWasScheduled: bird.returnToNestAt > window.world.time
            };
        });

        expect(result.birdWasInsideNest).toBe(true);
        expect(result.birdFled).toBe(true);
        expect(result.nestWasPreserved).toBe(true);
        expect(result.returnWasScheduled).toBe(true);
    });

    test('birds stay in motion at a uniform speed and flee without speeding up', async ({ page }) => {
        const result = await page.evaluate(() => {
            const playerPosition = window.playerBody.position.clone();
            const playerVelocity = window.playerBody.velocity.clone();
            const existingBirds = window.birds.splice(0, window.birds.length);
            const bird = {
                mesh: window.createBirdMesh(),
                velocity: new THREE.Vector3(),
                flapOffset: 0,
                flapSpeed: 10,
                flySpeed: 12,
                state: 'flying',
                perchTargetBody: null,
                perchUntil: 0
            };
            const birdHeight = new THREE.Box3().setFromObject(bird.mesh).getSize(new THREE.Vector3()).y;
            window.scene.add(bird.mesh);
            window.birds.push(bird);

            try {
                window.playerBody.position.y = playerPosition.y + 50;
                window.playerBody.velocity.set(1, 0, 0);
                bird.mesh.position.set(playerPosition.x + 5, window.playerBody.position.y, playerPosition.z);
                window.updateBirds(0, 100000);
                const stayedAtFiveUnits = Math.abs(bird.velocity.length() - window.birdFlightSpeed) < 0.001;
                const velocityAtFiveUnits = bird.velocity.clone();

                bird.mesh.position.set(playerPosition.x + 3, window.playerBody.position.y, playerPosition.z);
                window.updateBirds(0, 100000);

                return {
                    birdHeight,
                    stayedAtFiveUnits,
                    fledAtThreeUnits: bird.velocity.distanceTo(velocityAtFiveUnits) > 0.001 &&
                        Math.abs(bird.velocity.length() - window.birdFlightSpeed) < 0.001
                };
            } finally {
                window.scene.remove(bird.mesh);
                window.birds.splice(0, window.birds.length, ...existingBirds);
                window.playerBody.position.copy(playerPosition);
                window.playerBody.velocity.copy(playerVelocity);
            }
        });

        expect(result.birdHeight).toBeCloseTo(0.25, 5);
        expect(result.stayedAtFiveUnits).toBe(true);
        expect(result.fledAtThreeUnits).toBe(true);
    });

    test('sky flocks can target perches while flying across the sky', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalRandom = Math.random;
            const initialBirds = new Set(window.birds);
            Math.random = () => 0;

            try {
                window.spawnBirdGroup();
                const spawnedBird = window.birds.find(bird => !initialBirds.has(bird));
                const startPosition = spawnedBird.mesh.position.clone();

                for (let i = 0; i < 10; i++) {
                    window.updateBirds(0.1, 100000);
                }

                return {
                    hasPerchTarget: spawnedBird.perchTargetBody !== null,
                    remainsFlying: spawnedBird.state === 'flying',
                    moved: spawnedBird.mesh.position.distanceTo(startPosition) > 1
                };
            } finally {
                Math.random = originalRandom;
                window.birds.slice().forEach(bird => {
                    if (!initialBirds.has(bird)) {
                        window.scene.remove(bird.mesh);
                        window.birds.splice(window.birds.indexOf(bird), 1);
                    }
                });
            }
        });

        expect(result.hasPerchTarget).toBe(true);
        expect(result.remainsFlying).toBe(true);
        expect(result.moved).toBe(true);
    });

    test('birds cannot fly or land through solid objects', async ({ page }) => {
        const result = await page.evaluate(() => {
            const solidBody = {
                position: new THREE.Vector3(0, 3, 0),
                quaternion: new THREE.Quaternion(),
                userData: {
                    dimensions: { width: 2, height: 2, depth: 2 },
                    type: 'test_solid'
                }
            };
            const treeBody = {
                position: new THREE.Vector3(0, 3, 0),
                quaternion: new THREE.Quaternion(),
                userData: {
                    dimensions: { width: 2, height: 2, depth: 2 },
                    growthStage: 'arvore_adulta',
                    type: 'muda_arvore'
                }
            };
            window.placedConstructionBodies.push(solidBody);
            try {
                const solidBlocked = window.isBirdFlightSegmentBlocked(
                    new THREE.Vector3(-5, 3, 0),
                    new THREE.Vector3(5, 3, 0)
                );
                window.placedConstructionBodies.splice(
                    window.placedConstructionBodies.indexOf(solidBody),
                    1
                );
                window.placedConstructionBodies.push(treeBody);
                const treeBlocked = window.isBirdFlightSegmentBlocked(
                    new THREE.Vector3(-5, 3, 0),
                    new THREE.Vector3(5, 3, 0)
                );
                return { solidBlocked, treeBlocked };
            } finally {
                [solidBody, treeBody].forEach(body => {
                    const index = window.placedConstructionBodies.indexOf(body);
                    if (index !== -1) window.placedConstructionBodies.splice(index, 1);
                });
            }
        });

        expect(result.solidBlocked).toBe(true);
        expect(result.treeBlocked).toBe(false);
    });

    test('birds immediately take a random clear route and keep moving around obstacles', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalRandom = Math.random;
            const playerPosition = window.playerBody.position.clone();
            const playerVelocity = window.playerBody.velocity.clone();
            const cameraPosition = window.camera.position.clone();
            const obstacleBody = {
                position: new THREE.Vector3(cameraPosition.x + 2, 10, cameraPosition.z),
                userData: {
                    dimensions: { width: 2, height: 12, depth: 16 },
                    type: 'test_obstacle'
                }
            };
            const bird = {
                mesh: window.createBirdMesh(),
                velocity: new THREE.Vector3(12, 0, 0),
                flapOffset: 0,
                flapSpeed: 10,
                flySpeed: 12,
                state: 'flying',
                perchTargetBody: null,
                perchUntil: 0
            };
            bird.mesh.position.set(cameraPosition.x, 10, cameraPosition.z);
            window.scene.add(bird.mesh);
            window.placedConstructionBodies.push(obstacleBody);
            window.birds.push(bird);
            Math.random = () => 0.25;

            try {
                window.playerBody.position.set(cameraPosition.x + 100, cameraPosition.y, cameraPosition.z);
                window.playerBody.velocity.set(0, 0, 0);
                const initialVelocity = bird.velocity.clone();
                const initialPosition = bird.mesh.position.clone();
                window.updateBirds(0.1, 100000);
                const immediatelyRerouted = !bird.velocity.equals(initialVelocity);
                const movedOnCollisionFrame = bird.mesh.position.distanceTo(initialPosition) > 0;
                let movedEveryFrame = true;

                for (let i = 0; i < 10; i++) {
                    const previousPosition = bird.mesh.position.clone();
                    window.updateBirds(0.1, 100000);
                    movedEveryFrame &&= bird.mesh.position.distanceTo(previousPosition) > 0;
                }

                return { immediatelyRerouted, movedOnCollisionFrame, movedEveryFrame };
            } finally {
                Math.random = originalRandom;
                window.scene.remove(bird.mesh);
                window.birds.splice(window.birds.indexOf(bird), 1);
                window.placedConstructionBodies.splice(
                    window.placedConstructionBodies.indexOf(obstacleBody),
                    1
                );
                window.playerBody.position.copy(playerPosition);
                window.playerBody.velocity.copy(playerVelocity);
            }
        });

        expect(result.immediatelyRerouted).toBe(true);
        expect(result.movedOnCollisionFrame).toBe(true);
        expect(result.movedEveryFrame).toBe(true);
    });

    test('birds release blocked perch targets instead of repeatedly flying into obstacles', async ({ page }) => {
        const result = await page.evaluate(() => {
            const playerPosition = window.playerBody.position.clone();
            const playerVelocity = window.playerBody.velocity.clone();
            const cameraPosition = window.camera.position.clone();
            const obstacleBody = {
                position: new THREE.Vector3(cameraPosition.x + 5, 8, cameraPosition.z + 30),
                userData: {
                    dimensions: { width: 2, height: 2, depth: 2 },
                    type: 'test_obstacle'
                }
            };
            const perchBody = {
                position: new THREE.Vector3(cameraPosition.x + 10, 5, cameraPosition.z + 30),
                userData: {
                    dimensions: { width: 2, height: 2, depth: 2 },
                    type: 'test_perch'
                }
            };
            const obstacleMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
            const perchMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
            obstacleMesh.position.copy(obstacleBody.position);
            perchMesh.position.copy(perchBody.position);
            const bird = {
                mesh: window.createBirdMesh(),
                velocity: new THREE.Vector3(12, 0, 0),
                flapOffset: 0,
                flapSpeed: 10,
                flySpeed: 12,
                state: 'flying',
                perchTargetBody: perchBody,
                perchUntil: 0
            };
            bird.mesh.position.set(cameraPosition.x, 10, cameraPosition.z + 30);
            window.scene.add(obstacleMesh, perchMesh, bird.mesh);
            window.placedConstructionBodies.push(obstacleBody, perchBody);
            window.placedConstructionMeshes.push(obstacleMesh, perchMesh);
            window.birds.push(bird);

            try {
                window.playerBody.position.set(cameraPosition.x + 100, cameraPosition.y, cameraPosition.z);
                window.playerBody.velocity.set(0, 0, 0);
                for (let i = 0; i < 30 && bird.perchTargetBody; i++) {
                    window.updateBirds(0.1, 100000);
                }
                return { releasedBlockedTarget: bird.perchTargetBody === null };
            } finally {
                window.scene.remove(obstacleMesh, perchMesh, bird.mesh);
                window.birds.splice(window.birds.indexOf(bird), 1);
                [obstacleBody, perchBody].forEach(body => {
                    const index = window.placedConstructionBodies.indexOf(body);
                    if (index !== -1) window.placedConstructionBodies.splice(index, 1);
                });
                [obstacleMesh, perchMesh].forEach(mesh => {
                    const index = window.placedConstructionMeshes.indexOf(mesh);
                    if (index !== -1) window.placedConstructionMeshes.splice(index, 1);
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                });
                window.playerBody.position.copy(playerPosition);
                window.playerBody.velocity.copy(playerVelocity);
            }
        });

        expect(result.releasedBlockedTarget).toBe(true);
    });

    test('birds can perch on the ground but not on campfires', async ({ page }) => {
        const result = await page.evaluate(() => {
            const playerPosition = window.playerBody.position.clone();
            const playerVelocity = window.playerBody.velocity.clone();
            const cameraPosition = window.camera.position.clone();
            const start = new THREE.Vector3(cameraPosition.x - 20, 40, cameraPosition.z);
            const end = new THREE.Vector3(cameraPosition.x + 20, 40, cameraPosition.z);
            const groundTarget = window.findBirdGroundPerchTarget(start, end);
            if (!groundTarget) {
                return { foundGroundTarget: false, landedOnGround: false, avoidedCampfire: false };
            }

            const campfireBody = {
                position: new THREE.Vector3(
                    groundTarget.position.x + 4,
                    window.getSurfaceHeight(
                        groundTarget.position.x + 4,
                        groundTarget.position.z
                    ) + 0.3,
                    groundTarget.position.z
                ),
                userData: {
                    type: 'fogueira',
                    dimensions: { width: 0.8, height: 0.6, depth: 0.8 }
                }
            };
            const campfireMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.6, 0.8),
                new THREE.MeshBasicMaterial()
            );
            campfireMesh.position.copy(campfireBody.position);
            const campfireBird = {
                mesh: window.createBirdMesh(),
                velocity: new THREE.Vector3(),
                flapOffset: 0,
                flapSpeed: 10,
                flySpeed: 12,
                state: 'perched',
                perchTargetBody: campfireBody,
                perchUntil: window.world.time + 10
            };
            const groundBird = {
                mesh: window.createBirdMesh(),
                velocity: new THREE.Vector3(),
                flapOffset: 0,
                flapSpeed: 10,
                flySpeed: 12,
                state: 'flying',
                perchTargetBody: groundTarget,
                perchUntil: 0
            };

            campfireBird.mesh.position.set(
                campfireBody.position.x,
                campfireBody.position.y + campfireBody.userData.dimensions.height / 2 +
                    campfireBird.mesh.userData.perchHeight,
                campfireBody.position.z
            );
            groundBird.mesh.position.set(
                groundTarget.position.x,
                groundTarget.position.y + groundBird.mesh.userData.perchHeight,
                groundTarget.position.z
            );
            window.scene.add(campfireMesh, campfireBird.mesh, groundBird.mesh);
            window.placedConstructionBodies.push(campfireBody);
            window.placedConstructionMeshes.push(campfireMesh);
            window.birds.push(campfireBird, groundBird);

            try {
                window.playerBody.position.set(cameraPosition.x + 100, cameraPosition.y, cameraPosition.z);
                window.playerBody.velocity.set(0, 0, 0);
                window.updateBirds(0.016, 100000);

                return {
                    foundGroundTarget: true,
                    landedOnGround: groundBird.state === 'perched' &&
                        groundBird.perchTargetBody === groundTarget &&
                        Math.abs(groundBird.mesh.position.y -
                            (groundTarget.position.y + groundBird.mesh.userData.perchHeight)) < 0.001,
                    avoidedCampfire: campfireBird.state !== 'perched' &&
                        campfireBird.perchTargetBody === null
                };
            } finally {
                window.scene.remove(campfireMesh, campfireBird.mesh, groundBird.mesh);
                [campfireBird, groundBird].forEach(bird => {
                    const index = window.birds.indexOf(bird);
                    if (index !== -1) window.birds.splice(index, 1);
                });
                const bodyIndex = window.placedConstructionBodies.indexOf(campfireBody);
                if (bodyIndex !== -1) window.placedConstructionBodies.splice(bodyIndex, 1);
                const meshIndex = window.placedConstructionMeshes.indexOf(campfireMesh);
                if (meshIndex !== -1) window.placedConstructionMeshes.splice(meshIndex, 1);
                campfireMesh.geometry.dispose();
                campfireMesh.material.dispose();
                window.playerBody.position.copy(playerPosition);
                window.playerBody.velocity.copy(playerVelocity);
            }
        });

        expect(result.foundGroundTarget).toBe(true);
        expect(result.landedOnGround).toBe(true);
        expect(result.avoidedCampfire).toBe(true);
    });

    test('birds do not perch on trees', async ({ page }) => {
        const result = await page.evaluate(() => {
            const playerPosition = window.playerBody.position.clone();
            const playerVelocity = window.playerBody.velocity.clone();
            const cameraPosition = window.camera.position.clone();
            const treeBody = {
                position: new THREE.Vector3(cameraPosition.x + 2, 4, cameraPosition.z),
                userData: {
                    growthStage: 'arvore_adulta',
                    dimensions: { width: 3, height: 8, depth: 3 }
                }
            };
            const bird = {
                mesh: window.createBirdMesh(),
                velocity: new THREE.Vector3(),
                flapOffset: 0,
                flapSpeed: 10,
                flySpeed: 12,
                state: 'perched',
                perchTargetBody: treeBody,
                perchUntil: window.world.time + 10
            };
            bird.mesh.position.set(treeBody.position.x, 8.5, treeBody.position.z);
            window.scene.add(bird.mesh);
            window.birds.push(bird);

            try {
                window.playerBody.position.set(cameraPosition.x + 100, cameraPosition.y, cameraPosition.z);
                window.playerBody.velocity.set(0, 0, 0);
                window.updateBirds(0.016, 100000);
                return {
                    tookOff: bird.state === 'flying',
                    targetReleased: bird.perchTargetBody === null
                };
            } finally {
                window.scene.remove(bird.mesh);
                window.birds.splice(window.birds.indexOf(bird), 1);
                window.playerBody.position.copy(playerPosition);
                window.playerBody.velocity.copy(playerVelocity);
            }
        });

        expect(result.tookOff).toBe(true);
        expect(result.targetReleased).toBe(true);
    });

    test('birds stay below the altitude limit and do not fly vertically', async ({ page }) => {
        const result = await page.evaluate(() => {
            const playerPosition = window.playerBody.position.clone();
            const playerVelocity = window.playerBody.velocity.clone();
            const cameraPosition = window.camera.position.clone();
            const bird = {
                mesh: window.createBirdMesh(),
                velocity: new THREE.Vector3(0, 15, 0),
                flapOffset: 0,
                flapSpeed: 10,
                flySpeed: 12,
                state: 'flying',
                perchTargetBody: null,
                perchUntil: 0
            };
            bird.mesh.position.set(cameraPosition.x + 30, 78, cameraPosition.z + 30);
            window.scene.add(bird.mesh);
            window.birds.push(bird);
            let maxAltitude = bird.mesh.position.y;
            let keptHorizontalMotion = false;
            let respectedFlightAngle = true;

            try {
                window.playerBody.position.set(cameraPosition.x + 100, cameraPosition.y, cameraPosition.z);
                window.playerBody.velocity.set(0, 0, 0);
                for (let i = 0; i < 20; i++) {
                    window.updateBirds(0.1, 100000);
                    maxAltitude = Math.max(maxAltitude, bird.mesh.position.y);
                    keptHorizontalMotion ||= Math.hypot(bird.velocity.x, bird.velocity.z) > 0;
                    respectedFlightAngle &&=
                        Math.abs(bird.velocity.y) <= Math.hypot(bird.velocity.x, bird.velocity.z) * 0.35 + 0.001;
                }
                return {
                    maxAltitude,
                    keptHorizontalMotion,
                    respectedFlightAngle
                };
            } finally {
                window.scene.remove(bird.mesh);
                window.birds.splice(window.birds.indexOf(bird), 1);
                window.playerBody.position.copy(playerPosition);
                window.playerBody.velocity.copy(playerVelocity);
            }
        });

        expect(result.maxAltitude).toBeLessThanOrEqual(80);
        expect(result.keptHorizontalMotion).toBe(true);
        expect(result.respectedFlightAngle).toBe(true);
    });

    test('birds can take off after perching on a solid object', async ({ page }) => {
        const result = await page.evaluate(() => {
            const playerPosition = window.playerBody.position.clone();
            const playerVelocity = window.playerBody.velocity.clone();
            const cameraPosition = window.camera.position.clone();
            const groundY = window.getSurfaceHeight(cameraPosition.x, cameraPosition.z);
            const perchBody = {
                position: new THREE.Vector3(cameraPosition.x, groundY + 0.01, cameraPosition.z),
                userData: { dimensions: { width: 2, height: 0.02, depth: 2 } }
            };
            const perchMesh = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.02, 2),
                new THREE.MeshBasicMaterial()
            );
            perchMesh.position.copy(perchBody.position);
            const bird = {
                mesh: window.createBirdMesh(),
                velocity: new THREE.Vector3(),
                flapOffset: 0,
                flapSpeed: 10,
                flySpeed: 12,
                state: 'perched',
                perchTargetBody: perchBody,
                perchUntil: window.world.time - 1
            };
            bird.mesh.position.set(
                cameraPosition.x,
                perchBody.position.y + perchBody.userData.dimensions.height / 2 +
                    bird.mesh.userData.perchHeight,
                cameraPosition.z
            );
            window.scene.add(perchMesh, bird.mesh);
            window.placedConstructionBodies.push(perchBody);
            window.placedConstructionMeshes.push(perchMesh);
            window.birds.push(bird);

            try {
                window.playerBody.position.set(cameraPosition.x + 100, cameraPosition.y, cameraPosition.z);
                window.playerBody.velocity.set(0, 0, 0);
                for (let i = 0; i < 20; i++) {
                    window.updateBirds(0.016, 100000);
                }

                return {
                    tookOff: bird.state === 'flying',
                    clearedPerch: bird.mesh.position.y > perchBody.position.y +
                        perchBody.userData.dimensions.height / 2 + 0.5,
                    releasedClearance: bird.takeoffClearanceBody === null
                };
            } finally {
                window.scene.remove(perchMesh, bird.mesh);
                const birdIndex = window.birds.indexOf(bird);
                if (birdIndex !== -1) window.birds.splice(birdIndex, 1);
                const bodyIndex = window.placedConstructionBodies.indexOf(perchBody);
                if (bodyIndex !== -1) window.placedConstructionBodies.splice(bodyIndex, 1);
                const meshIndex = window.placedConstructionMeshes.indexOf(perchMesh);
                if (meshIndex !== -1) window.placedConstructionMeshes.splice(meshIndex, 1);
                perchMesh.geometry.dispose();
                perchMesh.material.dispose();
                window.playerBody.position.copy(playerPosition);
                window.playerBody.velocity.copy(playerVelocity);
            }
        });

        expect(result.tookOff).toBe(true);
        expect(result.clearedPerch).toBe(true);
        expect(result.releasedClearance).toBe(true);
    });

    test('birds have colorful anatomy and can land on world objects', async ({ page }) => {
        const result = await page.evaluate(() => {
            const testBird = window.createBirdMesh();
            const testBirdHeight = new THREE.Box3().setFromObject(testBird).getSize(new THREE.Vector3()).y;
            const geometryTypes = new Set();
            const colors = new Set();
            const treeCounts = { normal: 0, apple: 0, coconut: 0 };
            const nestTrees = window.placedConstructionBodies.filter(body =>
                body.userData?.growthStage === 'arvore_adulta' && body.userData.hasBirdNest
            );
            const savedNestTreeCount = window.getGameStateData().placedConstructions.filter(
                construction => construction.userData?.hasBirdNest
            ).length;
            const nestFlockSizes = nestTrees.map(tree => window.birds.filter(bird =>
                bird.isNestBird && bird.nestTreeBody === tree
            ).length);
            window.placedConstructionBodies.forEach(body => {
                if (body.userData?.growthStage !== 'arvore_adulta') return;
                const type = body.userData.treeType || 'normal';
                if (treeCounts[type] !== undefined) treeCounts[type]++;
            });
            testBird.traverse(object => {
                if (!object.isMesh) return;
                geometryTypes.add(object.geometry.type);
                colors.add(object.material.color.getHex());
            });

            const originalRandom = Math.random;
            const playerPosition = window.playerBody.position.clone();
            const playerVelocity = window.playerBody.velocity.clone();
            const cameraPosition = window.camera.position.clone();
            const perchBody = {
                position: new THREE.Vector3(
                    cameraPosition.x,
                    window.getSurfaceHeight(cameraPosition.x, cameraPosition.z) + 0.5,
                    cameraPosition.z
                ),
                userData: { dimensions: { width: 2, height: 1, depth: 2 } }
            };
            const perchMesh = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1, 2),
                new THREE.MeshBasicMaterial()
            );
            perchMesh.position.copy(perchBody.position);
            window.scene.add(perchMesh);
            window.placedConstructionBodies.push(perchBody);
            window.placedConstructionMeshes.push(perchMesh);
            const start = new THREE.Vector3(cameraPosition.x - 20, 40, cameraPosition.z);
            const end = new THREE.Vector3(cameraPosition.x + 20, 40, cameraPosition.z);
            let spawnedBird;
            let orientationBird;
            let generatedBird;
            let fleeingNestBirds = [];

            try {
                window.playerBody.position.set(cameraPosition.x + 100, cameraPosition.y, cameraPosition.z);
                window.playerBody.velocity.set(0, 0, 0);
                Math.random = () => 0;
                const existingBirds = new Set(window.birds);
                window.spawnBirdGroup();
                generatedBird = window.birds.find(bird => !existingBirds.has(bird));
                const nestTreeToBreak = nestTrees[0];
                const nestBirdsBeforeBreak = window.birds.filter(bird =>
                    bird.isNestBird && bird.nestTreeBody === nestTreeToBreak
                );
                const nestFlockSize = window.spawnBirdsFromTree(nestTreeToBreak);
                fleeingNestBirds = nestBirdsBeforeBreak.filter(bird =>
                    bird.nestTreeBody === null && bird.soundTime !== undefined
                );
                const destroyedNestFlagCleared = !nestTreeToBreak.userData.hasBirdNest;

                const target = window.findBirdPerchTarget(start, end);
                const groundTarget = window.findBirdGroundPerchTarget(start, end);
                const oceanTarget = window.findBirdGroundPerchTarget(
                    new THREE.Vector3(400, 40, -20),
                    new THREE.Vector3(400, 40, 20)
                );
                spawnedBird = {
                    mesh: window.createBirdMesh(),
                    velocity: new THREE.Vector3(0, 0, 1),
                    flapOffset: 0,
                    flapSpeed: 10,
                    flySpeed: 12,
                    state: 'flying',
                    perchTargetBody: perchBody,
                    perchUntil: 0
                };
                spawnedBird.mesh.position.set(
                    cameraPosition.x,
                    perchBody.position.y + perchBody.userData.dimensions.height / 2 + 0.48,
                    cameraPosition.z
                );
                window.scene.add(spawnedBird.mesh);
                window.birds.push(spawnedBird);
                window.updateBirds(0.016, 100000);
                const landed = spawnedBird.state === 'perched';
                const landedHeight = spawnedBird.mesh.position.y;
                const perchSurfaceHeight = perchBody.position.y + perchBody.userData.dimensions.height / 2;
                const landedBounds = new THREE.Box3().setFromObject(spawnedBird.mesh);
                const landedContactGap = landedBounds.min.y - perchSurfaceHeight;
                const perchDuration = spawnedBird.perchUntil - window.world.time;
                const foldedWingAngles = [
                    spawnedBird.mesh.userData.leftWing.rotation.y,
                    spawnedBird.mesh.userData.rightWing.rotation.y
                ];
                const foldedWingVerticalAngles = [
                    spawnedBird.mesh.userData.leftWing.rotation.z,
                    spawnedBird.mesh.userData.rightWing.rotation.z
                ];
                const landedTilt = new THREE.Euler().setFromQuaternion(spawnedBird.mesh.quaternion, 'YXZ');
                window.world.time += 5;
                window.updateBirds(0.016, 100000);
                const perchedHeightAfterTime = spawnedBird.mesh.position.y;

                window.playerBody.position.copy(spawnedBird.mesh.position);
                window.playerBody.velocity.set(0, 0, 0);
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
                window.updateBirds(0.016, 100000);

                orientationBird = {
                    mesh: window.createBirdMesh(),
                    velocity: new THREE.Vector3(0, 0, 1),
                    flapOffset: 0,
                    flapSpeed: 10,
                    flySpeed: 12,
                    state: 'flying',
                    perchTargetBody: null,
                    perchUntil: 0
                };
                orientationBird.mesh.position.set(cameraPosition.x + 30, cameraPosition.y, cameraPosition.z);
                window.scene.add(orientationBird.mesh);
                window.birds.push(orientationBird);
                const originalWorldTime = window.world.time;
                window.world.time = 0;
                window.updateBirds(0.016, 100000);
                const wingsOpen = orientationBird.mesh.userData.leftWing.rotation.y;
                window.world.time = Math.PI / (orientationBird.flapSpeed * 0.55);
                window.updateBirds(0.016, 100000);
                const wingsFolded = orientationBird.mesh.userData.leftWing.rotation.y;
                window.world.time = originalWorldTime;
                const facingDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(orientationBird.mesh.quaternion);
                orientationBird.mesh.scale.setScalar(2);
                orientationBird.velocity.set(0, 10, 0);
                window.updateBirds(0.016, 100000);
                const takeoffScale = orientationBird.mesh.scale.toArray();
                const takeoffTilt = new THREE.Euler().setFromQuaternion(
                    orientationBird.mesh.quaternion,
                    'YXZ'
                );
                orientationBird.velocity.set(0, -10, 0);
                window.updateBirds(0.016, 100000);
                const descentScale = orientationBird.mesh.scale.toArray();
                const descentTilt = new THREE.Euler().setFromQuaternion(
                    orientationBird.mesh.quaternion,
                    'YXZ'
                );

                return {
                    geometryTypes: Array.from(geometryTypes),
                    testBirdHeight,
                    colorCount: colors.size,
                    treeCounts,
                    nestTreeCount: nestTrees.length,
                    savedNestTreeCount,
                    nestFlockSizes,
                    nestFlockSize,
                    nestBirdCount: fleeingNestBirds.length,
                    nestBirdsLaunched: fleeingNestBirds.every(bird => bird.state === 'flying' && bird.velocity.y > 0),
                    fleeSoundsScheduled: fleeingNestBirds.every(bird =>
                        bird.soundTime !== undefined || bird.fleeSoundPlayed
                    ),
                    destroyedNestFlagCleared,
                    objectTargetSelected: target !== null && !target.isGroundPerch,
                    groundTargetIsDry: groundTarget?.isGroundPerch &&
                        !window.hasWaterAt(groundTarget.position.x, groundTarget.position.z),
                    waterTargetRejected: oceanTarget === null,
                    landed,
                    landedHeight,
                    expectedHeight: perchSurfaceHeight + spawnedBird.mesh.userData.perchHeight,
                    landedContactGap,
                    perchedHeightAfterTime,
                    perchDuration,
                    foldedWingAngles,
                    foldedWingVerticalAngles,
                    landedTilt: { x: landedTilt.x, z: landedTilt.z },
                    wingsOpen,
                    wingsFolded,
                    generatedFlySpeed: generatedBird?.flySpeed,
                    scared: spawnedBird.state === 'flying' && spawnedBird.perchTargetBody === null,
                    facingForward: facingDirection.dot(new THREE.Vector3(0, 0, 1)) > 0.9,
                    takeoffScale,
                    descentScale,
                    expectedBirdScale: orientationBird.mesh.userData.heightScale,
                    takeoffTilt: takeoffTilt.x,
                    descentTilt: descentTilt.x
                };
            } finally {
                Math.random = originalRandom;
                window.scene.remove(testBird);
                const nestTreeToRestore = nestTrees[0];
                if (nestTreeToRestore) nestTreeToRestore.userData.hasBirdNest = true;
                fleeingNestBirds.forEach(bird => {
                    window.scene.remove(bird.mesh);
                    const birdIndex = window.birds.indexOf(bird);
                    if (birdIndex !== -1) window.birds.splice(birdIndex, 1);
                });
                window.populateBirdNests();
                const spawnedBirdIndex = window.birds.findIndex(bird => bird.mesh === spawnedBird?.mesh);
                if (spawnedBirdIndex !== -1) window.birds.splice(spawnedBirdIndex, 1);
                const orientationBirdIndex = window.birds.findIndex(bird => bird.mesh === orientationBird?.mesh);
                if (orientationBirdIndex !== -1) window.birds.splice(orientationBirdIndex, 1);
                window.scene.remove(spawnedBird?.mesh);
                window.scene.remove(orientationBird?.mesh);
                window.birds.slice().forEach(bird => {
                    if (bird === generatedBird) {
                        window.scene.remove(bird.mesh);
                        window.birds.splice(window.birds.indexOf(bird), 1);
                    }
                });
                window.playerBody.position.copy(playerPosition);
                window.playerBody.velocity.copy(playerVelocity);
                window.placedConstructionBodies.splice(window.placedConstructionBodies.indexOf(perchBody), 1);
                window.placedConstructionMeshes.splice(window.placedConstructionMeshes.indexOf(perchMesh), 1);
                window.scene.remove(perchMesh);
                perchMesh.geometry.dispose();
                perchMesh.material.dispose();
            }
        });

        expect(result.geometryTypes).toContain('SphereGeometry');
        expect(result.geometryTypes).toContain('ShapeGeometry');
        expect(result.geometryTypes).toContain('ConeGeometry');
        expect(result.testBirdHeight).toBeCloseTo(0.25, 5);
        expect(result.colorCount).toBeGreaterThanOrEqual(3);
        expect(result.treeCounts.normal).toBeGreaterThanOrEqual(10);
        expect(result.treeCounts.apple).toBeGreaterThanOrEqual(10);
        expect(result.treeCounts.coconut).toBeGreaterThanOrEqual(10);
        expect(result.nestTreeCount).toBe(10);
        expect(result.savedNestTreeCount).toBe(10);
        expect(result.nestFlockSizes.every(count => count >= 1 && count <= 5)).toBe(true);
        expect(result.nestFlockSize).toBeGreaterThanOrEqual(1);
        expect(result.nestFlockSize).toBeLessThanOrEqual(5);
        expect(result.nestBirdCount).toBe(result.nestFlockSize);
        expect(result.nestBirdsLaunched).toBe(true);
        expect(result.fleeSoundsScheduled).toBe(true);
        expect(result.destroyedNestFlagCleared).toBe(true);
        expect(result.objectTargetSelected).toBe(true);
        expect(result.groundTargetIsDry).toBe(true);
        expect(result.waterTargetRejected).toBe(true);
        expect(result.landed).toBe(true);
        expect(result.landedHeight).toBeCloseTo(result.expectedHeight, 5);
        expect(result.landedContactGap).toBeCloseTo(0, 5);
        expect(result.perchedHeightAfterTime).toBeCloseTo(result.landedHeight, 5);
        expect(result.perchDuration).toBeGreaterThanOrEqual(30);
        expect(result.foldedWingAngles[0]).toBeGreaterThan(1);
        expect(result.foldedWingAngles[1]).toBeLessThan(-1);
        expect(result.foldedWingVerticalAngles.every(angle => Math.abs(angle) < 0.01)).toBe(true);
        expect(Math.abs(result.landedTilt.x)).toBeLessThan(0.01);
        expect(Math.abs(result.landedTilt.z)).toBeLessThan(0.01);
        expect(Math.abs(result.wingsOpen)).toBeLessThan(0.01);
        expect(result.wingsFolded).toBeGreaterThan(0.6);
        expect(result.generatedFlySpeed).toBeGreaterThan(12);
        expect(result.scared).toBe(true);
        expect(result.facingForward).toBe(true);
        expect(result.takeoffScale).toEqual([
            result.expectedBirdScale,
            result.expectedBirdScale,
            result.expectedBirdScale
        ]);
        expect(result.descentScale).toEqual([
            result.expectedBirdScale,
            result.expectedBirdScale,
            result.expectedBirdScale
        ]);
        expect(Math.abs(result.takeoffTilt)).toBeLessThan(0.01);
        expect(Math.abs(result.descentTilt)).toBeLessThan(0.01);
    });
});
