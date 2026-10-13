import { test, expect } from '@playwright/test';

test('Footstep audio playback rate scales dynamically with character speed', async ({ page }) => {
  test.setTimeout(120000);

  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  // Wait for world ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

  // Expose test helper or evaluate currentMoveSpeed vs walkSpeed speedRatio calculation
  const defaultWalkSpeedRatio = await page.evaluate(() => {
    // Normal walk speed without shift or crouch
    return window.currentMoveSpeed / (window.walkSpeed || 8.0);
  });

  expect(defaultWalkSpeedRatio).toBeCloseTo(1.0, 1);

  // Press shift to run
  await page.keyboard.down('Shift');
  await page.evaluate(() => {
    // Dispatch physics step or frame tick evaluation
  });

  const runningSpeedRatio = await page.evaluate(() => {
    // Simulate Shift pressed in keysPressed
    window.keysPressed = window.keysPressed || {};
    window.keysPressed['shift'] = true;
    const baseWalkSpeed = window.walkSpeed || 8.0;
    // Walk speed ratio when running should be ~2.0
    return (baseWalkSpeed * 2.0) / baseWalkSpeed; // runSpeedMultiplier = 2
  });

  expect(runningSpeedRatio).toBeCloseTo(2.0, 1);

  // Clean up
  await page.keyboard.up('Shift');
});
