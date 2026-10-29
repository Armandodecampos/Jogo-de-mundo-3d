import { test } from '@playwright/test';

test('Record video and screenshot for raft update', async ({ page, context }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => localStorage.clear());
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

  await page.evaluate(async () => {
    Object.defineProperty(document, 'pointerLockElement', {
      get: () => window.renderer.domElement,
      configurable: true
    });

    // Open crafting modal
    window.openCraftingMenu('initial');
  });

  await page.waitForTimeout(1000);

  // Take screenshot of crafting menu showing raft recipe requirements
  await page.screenshot({ path: '/home/jules/verification/screenshots/raft_recipe_verification.png' });

  await page.evaluate(async () => {
    window.closeCraftingMenu();

    const playerPos = window.playerBody ? window.playerBody.position : { x: 0, y: 1, z: 0 };
    const raftX = playerPos.x;
    const raftY = playerPos.y - 0.2;
    const raftZ = playerPos.z - 1.0;

    window.createRaft(new CANNON.Vec3(raftX, raftY, raftZ));
    window.updateRaycastTargets();

    const raft = window.raftBodies[window.raftBodies.length - 1];

    window.camera.position.set(playerPos.x, playerPos.y + 1.0, playerPos.z);
    window.camera.lookAt(raftX, raftY, raftZ);
    window.camera.updateMatrixWorld(true);
  });

  await page.waitForTimeout(1000);

  // Drive raft
  await page.evaluate(async () => {
    const raft = window.raftBodies[window.raftBodies.length - 1];
    window.isDrivingRaft = true;
    window.currentRaftBody = raft;
  });

  await page.waitForTimeout(1000);
});
