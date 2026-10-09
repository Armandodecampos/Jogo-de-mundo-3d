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

  // 1. Check initial stone count and confirm all initial stones are STATIC and mass === 0
  const initialStonesInfo = await page.evaluate(() => {
    const stoneBoxes = window.collectibleBoxes.filter(box => box.body.userData && box.body.userData.type === 'pedra');
    return {
      count: stoneBoxes.length,
      allStatic: stoneBoxes.every(box => box.body.type === 2 && box.body.mass === 0) // 2 is CANNON.Body.STATIC
    };
  });
  console.log('Initial stone count:', initialStonesInfo.count, 'All static:', initialStonesInfo.allStatic);
  expect(initialStonesInfo.count).toBe(100);
  expect(initialStonesInfo.allStatic).toBe(true);

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
        // Force spawn at a low height for faster testing
        window.spawnMeteor(0, 0);
        const meteor = window.activeMeteors[window.activeMeteors.length - 1];
        meteor.mesh.position.y = 50; // Lower altitude
        meteor.speed = 100; // Faster meteor
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

  // 5. Wait for meteor impact
  await page.waitForFunction(() => {
    return (window.activeMeteors || []).length === 0;
  }, { timeout: 60000 });

  // 6. Check if stone count increased back and meteor-spawned stone is also static
  const finalStonesInfo = await page.evaluate(() => {
    const stoneBoxes = window.collectibleBoxes.filter(box => box.body.userData && box.body.userData.type === 'pedra');
    return {
      count: stoneBoxes.length,
      allStatic: stoneBoxes.every(box => box.body.type === 2 && box.body.mass === 0)
    };
  });
  console.log('Stone count after meteor impact:', finalStonesInfo.count, 'All static:', finalStonesInfo.allStatic);
  expect(finalStonesInfo.count).toBe(96);
  expect(finalStonesInfo.allStatic).toBe(true);
});
