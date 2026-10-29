import { test, expect } from '@playwright/test';

test('Raft floats above water surface and does not submerge player', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

  const result = await page.evaluate(async () => {
    Object.defineProperty(document, 'pointerLockElement', {
      get: () => window.renderer.domElement,
      configurable: true
    });

    // Find a coordinate in the sea where hasWaterAt is true
    let seaX = 150, seaZ = 150;
    for (let x = 100; x <= 250; x += 10) {
      for (let z = 100; z <= 250; z += 10) {
        if (window.hasWaterAt(x, z)) {
          seaX = x;
          seaZ = z;
          break;
        }
      }
    }

    const waterAtCoord = window.hasWaterAt(seaX, seaZ);

    // Place raft in open water
    window.createRaft(new CANNON.Vec3(seaX, -8, seaZ));
    const raft = window.raftBodies[window.raftBodies.length - 1];

    // Wait for physics steps
    await new Promise(r => setTimeout(r, 1000));

    const floatingY = raft.position.y;
    const waterLevel = window.waterLevel; // -8.0

    // Board raft
    window.isDrivingRaft = true;
    window.currentRaftBody = raft;

    await new Promise(r => setTimeout(r, 1000));

    const drivingRaftY = raft.position.y;
    const playerY = window.playerBody.position.y;
    const cameraY = window.camera.position.y;

    const isCameraUnderwater = cameraY < waterLevel;

    return {
      seaX,
      seaZ,
      waterAtCoord,
      floatingY,
      drivingRaftY,
      playerY,
      cameraY,
      waterLevel,
      isCameraUnderwater
    };
  });

  console.log('Raft buoyancy verification:', result);

  expect(result.waterAtCoord).toBe(true);
  expect(result.floatingY).toBeGreaterThanOrEqual(result.waterLevel);
  expect(result.drivingRaftY).toBeGreaterThanOrEqual(result.waterLevel);
  expect(result.playerY).toBeGreaterThan(result.waterLevel);
  expect(result.cameraY).toBeGreaterThan(result.waterLevel);
  expect(result.isCameraUnderwater).toBe(false);
});
