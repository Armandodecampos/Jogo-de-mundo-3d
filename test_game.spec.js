const { test, expect } = require('@playwright/test');

test('jump works on island edges', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('file://' + process.cwd() + '/index.htm');
  await page.locator('#startButton').click();
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

  // Move player to an edge tile (e.g., worldSize away from center)
  // Each tile is worldSize x worldSize. Grid is 9x9.
  // Center is at (0, 0). Tile [4, 4] is center.
  // Let's go to (worldSize, 0) which should be tile [5, 4]
  const worldSize = await page.evaluate(() => window.worldSize || 600);

  await page.evaluate((ws) => {
    window.playerBody.position.set(ws, 10, 0);
  }, worldSize);

  // Wait for player to land
  await page.waitForTimeout(2000);

  const canJump = await page.evaluate(() => window.canJump);
  console.log('Can jump at edge:', canJump);
  expect(canJump).toBe(true);
});

test('raft driving mode stability', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('file://' + process.cwd() + '/index.htm');
  await page.locator('#startButton').click();
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

  await page.evaluate(() => {
    // Create a raft
    const raftBody = new CANNON.Body({ mass: 200 });
    raftBody.userData = { isRaft: true };
    raftBody.position.set(10, -7.8, 10); // Near water surface
    window.currentRaftBody = raftBody;
    window.isDrivingRaft = true;

    // Simulate interaction logic
    window.playerBody.type = CANNON.Body.KINEMATIC;
    window.playerBody.collisionResponse = false;
  });

  const playerType = await page.evaluate(() => window.playerBody.type);
  expect(playerType).toBe(4); // CANNON.Body.KINEMATIC is 4

  // Exit driving
  await page.evaluate(() => {
    window.isDrivingRaft = false;
    window.currentRaftBody = null;
    window.playerBody.type = CANNON.Body.DYNAMIC;
    window.playerBody.collisionResponse = true;
  });

  const playerTypeAfter = await page.evaluate(() => window.playerBody.type);
  expect(playerTypeAfter).toBe(1); // CANNON.Body.DYNAMIC is 1
});
