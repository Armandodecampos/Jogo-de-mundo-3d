import { test, expect } from '@playwright/test';

test('Stone and Meteor logic verification', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:8080/index.htm');

  // Expose necessary internal variables for verification
  await page.evaluate(() => {
    // Before start
    localStorage.clear();
  });

  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // 1. Check initial stone count
  const stoneCountInitial = await page.evaluate(() => {
    return window.collectibleBoxes.filter(box => box.body.userData && box.body.userData.type === 'pedra').length;
  });
  console.log('Initial stone count:', stoneCountInitial);
  expect(stoneCountInitial).toBe(100);

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
  expect(stoneCountAfterRemoval).toBe(95);

  // 3. Trigger meteor manually for testing
  await page.evaluate(() => {
    if (typeof window.spawnMeteor === 'function') {
        window.spawnMeteor();
    } else {
        throw new Error('window.spawnMeteor is not defined');
    }
  });

  // 4. Check if meteor spawned
  await page.waitForFunction(() => {
    const activeMeteors = window.activeMeteors || [];
    return activeMeteors.length > 0;
  }, { timeout: 10000 });

  console.log('Meteor spawned successfully.');

  // 5. Wait for meteor impact (meteor speed is 40, distance is roughly 100-140, takes ~3-4 seconds)
  await page.waitForFunction(() => {
    return (window.activeMeteors || []).length === 0;
  }, { timeout: 10000 });

  // 6. Check if stone count increased back
  const finalStoneCount = await page.evaluate(() => {
    return window.collectibleBoxes.filter(box => box.body.userData && box.body.userData.type === 'pedra').length;
  });
  console.log('Stone count after meteor impact:', finalStoneCount);
  expect(finalStoneCount).toBe(96);
});
