
import { test, expect } from '@playwright/test';

test('Player can climb over the starting chest', async ({ page }) => {
    // Increase timeout for slow sandbox
    test.setTimeout(60000);

    await page.goto('file://' + process.cwd() + '/index.htm');

    // Start the game
    await page.click('#startButton');

    // Wait for the world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Get initial position
    const initialPos = await page.evaluate(() => {
        return { x: window.playerBody.position.x, y: window.playerBody.position.y, z: window.playerBody.position.z };
    });
    console.log('Initial position:', initialPos);

    // Press 'W' to walk forward towards the chest (at 0, -5)
    await page.keyboard.down('w');

    // Wait for a few seconds to let the player walk into the chest
    // and attempt to climb it.
    await page.waitForTimeout(3000);

    // Check position after walking
    const finalPos = await page.evaluate(() => {
        return { x: window.playerBody.position.x, y: window.playerBody.position.y, z: window.playerBody.position.z };
    });
    console.log('Final position:', finalPos);

    // The starting chest is 1.0m high.
    // The player's Y should increase by roughly 1.0m (or jump impulse should be visible)
    // Actually, when climbing, the player jumps (velocity.y = 11).
    // So we check if the Y is significantly higher than initial Y (accounting for initial fall from spawn)

    // Give it a bit more time to finish the jump if it just started
    await page.waitForTimeout(1000);

    const afterJumpPos = await page.evaluate(() => {
        return { x: window.playerBody.position.x, y: window.playerBody.position.y, z: window.playerBody.position.z };
    });
    console.log('After jump position:', afterJumpPos);

    await page.keyboard.up('w');

    // Verify if player reached the top of the chest or jumped.
    // Chest top is at startingChestHeight + 1.0.
    // Player bottom at top of chest is startingChestHeight + 1.0.
    // Player center is startingChestHeight + 1.0 + 0.87 = startingChestHeight + 1.87.

    const startingChestHeight = await page.evaluate(() => window.getSurfaceHeight(0, -5));
    const expectedMinY = startingChestHeight + 1.5; // Slightly below 1.87 to be safe

    expect(afterJumpPos.y).toBeGreaterThan(expectedMinY);

    await page.screenshot({ path: 'climb-test.png' });
});
