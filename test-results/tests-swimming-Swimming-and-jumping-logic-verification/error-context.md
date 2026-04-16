# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/swimming.spec.js >> Swimming and jumping logic verification
- Location: tests/swimming.spec.js:3:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 120000ms exceeded.
```

# Page snapshot

```yaml
- generic [active]:
  - text:  
  - option "Com Textura" [selected]
  - option "Sem Textura (Sólido)"
  - option "Ativado" [selected]
  - option "Desativado"
  - option "Ativado"
  - option "Desativado" [selected]
  - option "Ativado" [selected]
  - option "Desativado"
  - generic:
    - generic:
      - generic: VIDA
    - generic:
      - generic: FOLEGO
  - text:  
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('Swimming and jumping logic verification', async ({ page }) => {
  4  |   test.setTimeout(120000);
  5  |   await page.goto('http://localhost:8080/index.htm');
  6  |   await page.click('#startButton');
  7  |
  8  |   // Wait for world to be ready
> 9  |   await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
     |              ^ Error: page.waitForFunction: Test timeout of 120000ms exceeded.
  10 |
  11 |   // 1. Verify that jumping on land still works (at least doesn't crash and changes velocity)
  12 |   // Initially at (0, 10, 0), which is above waterLevel (-8)
  13 |   const initialVelocityY = await page.evaluate(() => window.playerBody.velocity.y);
  14 |
  15 |   // Press Space to jump
  16 |   await page.keyboard.press(' ');
  17 |
  18 |   // Check if velocity changed upwards
  19 |   const jumpVelocityY = await page.evaluate(() => window.playerBody.velocity.y);
  20 |   expect(jumpVelocityY).toBeGreaterThan(initialVelocityY);
  21 |
  22 |   // 2. Teleport player into water and verify surfacing logic
  23 |   await page.evaluate(() => {
  24 |     // waterLevel is -8. TargetY is now -8.0 (half submerged)
  25 |     // Put player deep in water at (400, -15, 400) - far from island center (0,0) to be in water
  26 |     window.playerBody.position.set(400, -15, 400);
  27 |     window.playerBody.velocity.set(0, 0, 0);
  28 |   });
  29 |
  30 |   // Wait a bit for physics to settle/detect water
  31 |   await page.waitForTimeout(500);
  32 |
  33 |   // Verify isInWater is true
  34 |   const isInWater = await page.evaluate(() => {
  35 |     const waterLevel = window.waterLevel || -8.0;
  36 |     const playerRadius = window.playerRadius || 1.5;
  37 |     const playerBottomY = window.playerBody.position.y - playerRadius;
  38 |     return playerBottomY < waterLevel;
  39 |   });
  40 |   expect(isInWater).toBe(true);
  41 |
  42 |   // Press and hold Space to swim up
  43 |   await page.keyboard.down(' ');
  44 |
  45 |   // Wait a few frames for velocity to be applied in animate loop
  46 |   await page.waitForTimeout(200);
  47 |
  48 |   const swimmingVelocityY = await page.evaluate(() => window.playerBody.velocity.y);
  49 |   const walkSpeed = await page.evaluate(() => window.walkSpeed || 5);
  50 |
  51 |   // Velocity should be exactly walkSpeed (5) due to our assignment in animate loop
  52 |   expect(swimmingVelocityY).toBeCloseTo(walkSpeed, 1);
  53 |
  54 |   await page.keyboard.up(' ');
  55 |
  56 |   // 3. Verify that player doesn't "jump" out of water with a single press
  57 |   // Reset position in water
  58 |   await page.evaluate(() => {
  59 |     window.playerBody.position.set(400, -15, 400);
  60 |     window.playerBody.velocity.set(0, 0, 0);
  61 |   });
  62 |   await page.waitForTimeout(200);
  63 |
  64 |   // Press Space briefly (using press)
  65 |   await page.keyboard.press(' ');
  66 |
  67 |   // isJumpBoosting should be false because we added !isInWater to the condition
  68 |   const isJumpBoosting = await page.evaluate(() => window.isJumpBoosting);
  69 |   expect(isJumpBoosting).toBe(false);
  70 | });
  71 |
```