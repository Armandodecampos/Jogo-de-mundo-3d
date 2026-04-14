const { test, expect } = require('@playwright/test');

test.describe('Cloud Damage System', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
        await page.evaluate(() => { window.gamePaused = false; });
    });

    test('player takes breath damage near clouds', async ({ page }) => {
        // Force spawn a cloud at a known position for the test
        await page.evaluate(() => {
            // Clear existing clouds
            window.clouds.forEach(c => window.scene.remove(c.mesh));
            window.clouds.length = 0;

            // Spawn one cloud at a specific position
            window.spawnCloud(true);
            const cloud = window.clouds[0];
            cloud.mesh.position.set(0, 100, 0);
            cloud.speed = 0; // Stop it from moving

            // Teleport player near the cloud
            window.playerBody.position.set(5, 100, 5); // Distance is sqrt(5^2 + 5^2) = ~7.07 < 15
            window.playerBody.velocity.set(0, 0, 0);
        });

        // Check breath after some time
        // Breath decreases at 15 units/s. Wait 1 second.
        await page.waitForTimeout(2000);
        let breath = await page.evaluate(() => window.playerBreath);
        expect(breath).toBeLessThan(100);
    });

    test('player takes breath damage at high altitude (>200)', async ({ page }) => {
        await page.evaluate(() => {
            window.playerBody.position.set(0, 250, 0);
            window.playerBody.velocity.set(0, 0, 0);
        });

        await page.waitForTimeout(2000);
        let breath = await page.evaluate(() => window.playerBreath);
        expect(breath).toBeLessThan(100);
    });

    test('player dies instantly at very high altitude (>500)', async ({ page }) => {
        await page.evaluate(() => {
            window.playerBody.position.set(0, 600, 0);
            window.playerBody.velocity.set(0, 0, 0);
        });

        await page.waitForTimeout(500);
        let health = await page.evaluate(() => window.playerHealth);
        expect(health).toBe(0);

        let isFainted = await page.evaluate(() => window.isFainted);
        expect(isFainted).toBe(true);
    });
});
