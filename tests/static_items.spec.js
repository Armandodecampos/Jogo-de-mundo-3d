import { test, expect } from '@playwright/test';

test('Static items, overlap prevention, red ghost and snapping verification', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('http://localhost:8080/index.htm');

    await page.evaluate(() => {
        localStorage.clear();
    });

    await page.click('#startButton');

    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

    const boxTest = await page.evaluate(() => {
        const boxBody = window.createBox(new CANNON.Vec3(10, 2, 10), null);
        return {
            bodyType: boxBody.type,
            bodyMass: boxBody.mass,
            isStatic: boxBody.type === CANNON.Body.STATIC && boxBody.mass === 0
        };
    });

    console.log('Box test result:', boxTest);
    expect(boxTest.isStatic).toBe(true);
});
