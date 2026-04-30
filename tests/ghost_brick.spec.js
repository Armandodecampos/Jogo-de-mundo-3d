const { test, expect } = require('@playwright/test');

test('find ghost object at origin', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true);

  const objectsAtOrigin = await page.evaluate(() => {
    const threshold = 1.0;
    const results = [];

    if (window.collectibleBoxes) {
        window.collectibleBoxes.forEach(box => {
          const pos = box.body.position;
          const dist = Math.sqrt(pos.x**2 + pos.z**2);
          if (dist < threshold) {
            results.push({
              array: 'collectibleBoxes',
              type: box.body.userData.type,
              position: { x: pos.x, y: pos.y, z: pos.z }
            });
          }
        });
    }

    if (window.placedConstructionBodies) {
        window.placedConstructionBodies.forEach(body => {
          const pos = body.position;
          const dist = Math.sqrt(pos.x**2 + pos.z**2);
          if (dist < threshold) {
            results.push({
              array: 'placedConstructionBodies',
              type: body.userData.type,
              position: { x: pos.x, y: pos.y, z: pos.z }
            });
          }
        });
    }

    return results;
  });

  console.log('Objects at origin:', JSON.stringify(objectsAtOrigin, null, 2));
});
