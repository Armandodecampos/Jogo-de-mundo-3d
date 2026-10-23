import { test, expect } from '@playwright/test';
import path from 'path';

test('Verify left-clicking non-destructible blocks produces no tool requirement notifications', async ({ page }) => {
  const filePath = 'file://' + path.resolve('index.htm');
  await page.goto(filePath);

  await page.evaluate(() => {
    if (window.startGame) {
      window.startGame();
    }
  });

  await page.waitForTimeout(1000);

  const testBlockTypes = ['cob', 'piso', 'bloco_madeira', 'piso_madeira', 'bloco_pedra', 'piso_pedra'];

  const results = await page.evaluate((types) => {
    const THREE = window.THREE;
    const testResults = {};

    // Ensure bare hands (empty slot)
    window.beltItems[window.selectedSlotIndex] = null;
    window.updateBeltDisplay();

    types.forEach((type, idx) => {
      // Reset notification
      const notifEl = document.getElementById('notification');
      if (notifEl) {
        notifEl.textContent = '';
        notifEl.classList.add('hidden');
      }

      const pos = new THREE.Vector3(0, 5, -(idx + 2) * 2);
      const quat = new THREE.Quaternion();
      window.createPlaceableBlock(pos, quat, type);

      const placedBody = window.placedConstructionBodies[window.placedConstructionBodies.length - 1];

      // Point camera at placed block
      window.camera.position.set(pos.x, pos.y, pos.z + 1.5);
      window.camera.lookAt(pos);

      // Reset state flags
      window.isDestroying = false;
      window.isAttemptingToDestroy = true;

      // Call startDestruction
      window.startDestruction();

      const notifText = notifEl ? notifEl.textContent : '';

      testResults[type] = {
        isDestructible: placedBody ? placedBody.userData.isDestructible : null,
        isDestroying: window.isDestroying,
        notificationText: notifText
      };
    });

    return testResults;
  }, testBlockTypes);

  console.log('Notification test results:', JSON.stringify(results, null, 2));

  for (const type of testBlockTypes) {
    expect(results[type].isDestructible).toBe(false);
    expect(results[type].isDestroying).toBe(false);
    expect(results[type].notificationText).toBe('');
  }
});
