const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000');

  // Wait for game to load
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

  // Find a stone and look at it
  await page.evaluate(() => {
    const stones = window.scene.children.filter(child => child.userData && child.userData.type === 'pedra');
    if (stones.length > 0) {
      const stone = stones[0];
      // Move player to stone
      window.playerBody.position.set(stone.position.x - 2, stone.position.y + 1, stone.position.z);
      // Look at stone
      window.camera.lookAt(stone.position);
      window.camera.updateMatrixWorld();
    }
  });

  // Wait a bit for raycast to update
  await page.waitForTimeout(1000);

  const hintText = await page.innerText('#interactionHint');
  console.log('Stone interaction hint text:', hintText);

  // Press G to collect
  await page.keyboard.press('KeyG');
  await page.waitForTimeout(500);

  // Check if stone is still there (should be removed from scene or moved)
  const stoneCount = await page.evaluate(() => {
    return window.scene.children.filter(child => child.userData && child.userData.type === 'pedra').length;
  });
  console.log('Stone count after collection:', stoneCount);

  await page.screenshot({ path: '/home/jules/verification/stone_test.png' });
  await browser.close();
})();
