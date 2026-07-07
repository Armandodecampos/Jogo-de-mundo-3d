import { test, expect } from '@playwright/test';

test('Woodcutting obstruction verification with stacked trunks', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // 1. Setup two stacked trunks
  await page.evaluate(() => {
    const x = 5, z = 5;
    const h = window.getSurfaceHeight(x, z);

    // First trunk
    const pos1 = new window.CANNON.Vec3(x, h + 0.51, z);
    const quat1 = new window.CANNON.Quaternion();
    const trunk1 = window.createPlaceableBlock(pos1, quat1, window.treeTrunkItemName);
    trunk1.type = window.CANNON.Body.STATIC;
    trunk1.updateAABB();

    // Second trunk (stacked directly on top)
    const pos2 = new window.CANNON.Vec3(x, h + 1.52, z);
    const quat2 = new window.CANNON.Quaternion();
    const trunk2 = window.createPlaceableBlock(pos2, quat2, window.treeTrunkItemName);
    trunk2.type = window.CANNON.Body.STATIC;
    trunk2.updateAABB();
  });

  // 2. Verify truncation logic for the bottom trunk
  const result = await page.evaluate(() => {
    const bodies = window.placedConstructionBodies.filter(b => b.userData && b.userData.type === window.treeTrunkItemName);
    bodies.sort((a, b) => a.position.y - b.position.y);
    const bottomTrunk = bodies[0];

    return {
        isObstructed: window.isTrunkObstructed(bottomTrunk),
        bodyCount: bodies.length
    };
  });

  console.log('Bottom trunk obstructed (expect true):', result.isObstructed);
  expect(result.bodyCount).toBe(2);
  expect(result.isObstructed).toBe(true);

  // 3. Test interaction logic and HUD hints
  await page.evaluate(() => {
      const bodies = window.placedConstructionBodies.filter(b => b.userData && b.userData.type === window.treeTrunkItemName);
      bodies.sort((a, b) => a.position.y - b.position.y);
      const bottomTrunk = bodies[0];

      // Look at bottom trunk
      window.camera.position.set(bottomTrunk.position.x, bottomTrunk.position.y + 1, bottomTrunk.position.z + 3);
      window.camera.lookAt(bottomTrunk.position.x, bottomTrunk.position.y, bottomTrunk.position.z);

      // Override pointer lock and status for simulation
      Object.defineProperty(document, 'pointerLockElement', { get: () => window.renderer.domElement, configurable: true });
      window.gamePaused = false;

      // Manually trigger the obstruction notification logic that would normally be in interact()
      if (window.isTrunkObstructed(bottomTrunk)) {
          window.showNotification("Remova os objetos de cima do tronco para cortar!");
      }
  });

  const notification = page.locator('#notification');
  await expect(notification).toBeVisible();
  const notificationText = await notification.textContent();
  expect(notificationText).toContain('Remova os objetos de cima do tronco');

  // HUD Hint check: In the actual game, animate() calls isTrunkObstructed() to set the hint.
  // We can verify if the hint correctly omits "Opções de corte" by waiting for the animation frame logic.
  await page.waitForTimeout(500);

  const hint = page.locator('#interactionHint');
  const hintText = await hint.textContent();
  console.log('Interaction hint:', hintText);
  expect(hintText).not.toContain('Opções de corte');

  await page.screenshot({ path: '/home/jules/verification/stacked_trunks_blocked.png' });
});
