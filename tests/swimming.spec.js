import { test, expect } from '@playwright/test';

test('Swimming and jumping logic verification', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });

  // 1. Verify that jumping on land still works (at least doesn't crash and changes velocity)
  // Initially at (0, 10, 0), which is above waterLevel (-8)
  const initialVelocityY = await page.evaluate(() => window.playerBody.velocity.y);

  // Press Space to jump
  await page.keyboard.press(' ');

  // Check if velocity changed upwards
  const jumpVelocityY = await page.evaluate(() => window.playerBody.velocity.y);
  expect(jumpVelocityY).toBeGreaterThan(initialVelocityY);

  // 2. Teleport player into water and verify surfacing logic
  await page.evaluate(() => {
    // waterLevel is -8. TargetY is around -6.5 (radius 1.5)
    // Put player deep in water at (400, -15, 400) - far from island center (0,0) to be in water
    window.playerBody.position.set(400, -15, 400);
    window.playerBody.velocity.set(0, 0, 0);
  });

  // Wait a bit for physics to settle/detect water
  await page.waitForTimeout(500);

  // Verify isInWater is true
  const isInWater = await page.evaluate(() => {
    const waterLevel = window.waterLevel || -8.0;
    const playerRadius = window.playerRadius || 1.5;
    const playerBottomY = window.playerBody.position.y - playerRadius;
    return playerBottomY < waterLevel;
  });
  expect(isInWater).toBe(true);

  // Press and hold Space to swim up
  await page.keyboard.down(' ');

  // Wait a few frames for velocity to be applied in animate loop
  await page.waitForTimeout(200);

  const swimmingVelocityY = await page.evaluate(() => window.playerBody.velocity.y);
  const walkSpeed = await page.evaluate(() => window.walkSpeed || 5);

  // Velocity should be exactly walkSpeed (5) due to our assignment in animate loop
  expect(swimmingVelocityY).toBeCloseTo(walkSpeed, 1);

  await page.keyboard.up(' ');

  // 3. Verify that player doesn't "jump" out of water with a single press
  // Reset position in water
  await page.evaluate(() => {
    window.playerBody.position.set(400, -15, 400);
    window.playerBody.velocity.set(0, 0, 0);
  });
  await page.waitForTimeout(200);

  // Press Space briefly (using press)
  await page.keyboard.press(' ');

  // isJumpBoosting should be false because we added !isInWater to the condition
  const isJumpBoosting = await page.evaluate(() => window.isJumpBoosting);
  expect(isJumpBoosting).toBe(false);
});
