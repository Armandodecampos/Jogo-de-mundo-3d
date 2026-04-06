import { test, expect } from '@playwright/test';

test('Meteor timer logic verification', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:8080/index.htm');

  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // 1. Check initial stone count
  const initialStoneCount = await page.evaluate(() => {
    return window.collectibleBoxes.filter(box => box.body.userData && box.body.userData.type === 'pedra').length;
  });
  console.log('Initial stone count:', initialStoneCount);
  expect(initialStoneCount).toBe(100);

  // 2. Remove some stones to trigger meteor logic
  await page.evaluate(() => {
    const stoneIndices = [];
    window.collectibleBoxes.forEach((box, i) => {
      if (box.body.userData.type === 'pedra') stoneIndices.push(i);
    });

    // Remove 5 stones
    for (let i = 0; i < 5; i++) {
        const idx = stoneIndices[i];
        const item = window.collectibleBoxes[idx];
        window.world.removeBody(item.body);
        window.scene.remove(item.mesh);
        window.collectibleBoxes.splice(idx, 1);
    }
    window.updateRaycastTargets();
  });

  const stoneCountAfterRemoval = await page.evaluate(() => {
    return window.collectibleBoxes.filter(box => box.body.userData && box.body.userData.type === 'pedra').length;
  });
  console.log('Stone count after removal:', stoneCountAfterRemoval);
  expect(stoneCountAfterRemoval).toBe(95);

  // 3. Fast-forward the timer manually to just before 60 seconds
  await page.evaluate(() => {
      // Set the last check time to 0, and current world.time is likely small.
      // We'll simulate time passage by jumping the last check time backward.
      window.lastMeteorCheckTime = -59;
  });

  // 4. Wait for the 60 second mark (which should be now since world.time is > 1)
  await page.waitForFunction(() => {
    const activeMeteors = window.activeMeteors || [];
    return activeMeteors.length > 0;
  }, { timeout: 10000 });

  console.log('Meteor spawned successfully by the timer.');

  // 5. Wait for meteor impact
  await page.waitForFunction(() => {
    return (window.activeMeteors || []).length === 0;
  }, { timeout: 10000 });

  // 6. Check if stone count increased
  const finalStoneCount = await page.evaluate(() => {
    return window.collectibleBoxes.filter(box => box.body.userData && box.body.userData.type === 'pedra').length;
  });
  console.log('Stone count after meteor impact:', finalStoneCount);
  expect(finalStoneCount).toBe(96);
});
