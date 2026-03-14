const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/index.htm');
  await page.click('button:has-text("Jogar")');
  await page.waitForFunction(() => window.isWorldReady === true);

  // Set camera to see the sea clearly
  await page.evaluate(() => {
    window.camera.position.set(0, 500, 0);
    window.camera.lookAt(0, 0, 500);
  });

  await page.waitForTimeout(2000); // Wait for shadows to settle
  await page.screenshot({ path: 'final_check.png' });
  await browser.close();
})();
