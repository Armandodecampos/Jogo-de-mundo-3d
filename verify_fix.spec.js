const { test } = require('@playwright/test');
test('capture junctions', async ({ page }) => {
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true);
  await page.evaluate(() => {
    const slider = document.getElementById('renderDistanceSlider');
    slider.value = 2000;
    slider.dispatchEvent(new Event('input'));
    window.playerBody.position.set(0, 1000, 0); // High overhead
    window.camera.rotation.set(-Math.PI/2, 0, 0);
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'final_verification.png' });
});
