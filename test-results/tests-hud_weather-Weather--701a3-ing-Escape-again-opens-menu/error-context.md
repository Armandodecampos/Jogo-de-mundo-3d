# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/hud_weather.spec.js >> Weather HUD Button >> Escape key releases mouse but keeps HUD visible; Pressing Escape again opens menu
- Location: tests/hud_weather.spec.js:41:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8080/index.htm
Call log:
  - navigating to "http://localhost:8080/index.htm", waiting until "load"

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  |
  3  | test.describe('Weather HUD Button', () => {
  4  |     test.beforeEach(async ({ page }) => {
  5  |         test.setTimeout(120000);
> 6  |         await page.goto('http://localhost:8080/index.htm');
     |                    ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8080/index.htm
  7  |         await page.click('#startButton');
  8  |         await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
  9  |         await page.evaluate(() => { window.gamePaused = false; });
  10 |     });
  11 |
  12 |     test('HUD weather toggle button works', async ({ page }) => {
  13 |         // Check initial state
  14 |         const initialTargetRain = await page.evaluate(() => window.targetRainIntensity);
  15 |         expect(initialTargetRain).toBe(0);
  16 |
  17 |         const initialHudText = await page.textContent('#hudWeatherText');
  18 |         expect(initialHudText).toBe('Sol');
  19 |
  20 |         // Click HUD toggle button
  21 |         await page.evaluate(() => {
  22 |             document.getElementById('hudWeatherToggle').click();
  23 |         });
  24 |
  25 |         // Verify state change
  26 |         const finalTargetRain = await page.evaluate(() => window.targetRainIntensity);
  27 |         expect(finalTargetRain).toBeGreaterThan(0);
  28 |
  29 |         const finalHudText = await page.textContent('#hudWeatherText');
  30 |         expect(finalHudText).toBe('Chuva');
  31 |
  32 |         // Toggle back to sun
  33 |         await page.evaluate(() => {
  34 |             document.getElementById('hudWeatherToggle').click();
  35 |         });
  36 |         const backToSunRain = await page.evaluate(() => window.targetRainIntensity);
  37 |         expect(backToSunRain).toBe(0);
  38 |         expect(await page.textContent('#hudWeatherText')).toBe('Sol');
  39 |     });
  40 |
  41 |     test('Escape key releases mouse but keeps HUD visible; Pressing Escape again opens menu', async ({ page }) => {
  42 |         const hudButtons = page.locator('#hudButtons');
  43 |         await expect(hudButtons).toBeVisible();
  44 |
  45 |         // Press Escape - should release mouse but NOT hide HUD (new behavior)
  46 |         await page.keyboard.press('Escape');
  47 |         await page.waitForFunction(() => document.pointerLockElement === null);
  48 |         await expect(hudButtons).toBeVisible();
  49 |
  50 |         // Verify menu is NOT active yet
  51 |         const optionsScreen = page.locator('#optionsScreen');
  52 |         await expect(optionsScreen).not.toHaveClass(/active/);
  53 |
  54 |         // Press Escape again - should now open the menu
  55 |         await page.keyboard.press('Escape');
  56 |         await expect(optionsScreen).toHaveClass(/active/);
  57 |         await expect(hudButtons).toBeHidden();
  58 |
  59 |         // Close menu
  60 |         await page.click('#resumeButton');
  61 |         await expect(hudButtons).toBeVisible();
  62 |         await expect(optionsScreen).not.toHaveClass(/active/);
  63 |     });
  64 | });
  65 |
```