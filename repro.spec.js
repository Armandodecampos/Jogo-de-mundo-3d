const { test } = require('@playwright/test');
test('capture junctions with textures', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true);

  await page.waitForFunction(() => {
    const mesh = window.islandMeshes[0].mesh;
    return mesh.material.userData.shader !== undefined;
  }, { timeout: 60000 });

  await page.evaluate(() => {
    const slider = document.getElementById('renderDistanceSlider');
    slider.value = 2000;
    slider.dispatchEvent(new Event('input'));
  });

  // Look at the corner (1000, 1000) from above
  await page.evaluate(() => {
    window.playerBody.position.set(900, 100, 900);
    window.camera.rotation.set(-Math.PI/4, Math.PI/4, 0);
  });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'junction_view_corner.png' });

  // Look at the sea junction (1000, 0)
  await page.evaluate(() => {
    window.playerBody.position.set(950, 5, 0);
    window.camera.rotation.set(-0.2, Math.PI/2, 0);
  });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'junction_view_side.png' });
});
