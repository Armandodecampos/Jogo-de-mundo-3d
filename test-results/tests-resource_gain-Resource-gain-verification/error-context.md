# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/resource_gain.spec.js >> Resource gain verification
- Location: tests/resource_gain.spec.js:3:5

# Error details

```
Test timeout of 300000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 300000ms exceeded.
```

# Page snapshot

```yaml
- generic [active]:
  - generic [ref=e1]:
    - heading "Small World" [level=1] [ref=e2]
    - generic [ref=e3]:
      - button "Jogar" [ref=e4] [cursor=pointer]
      - button "Configurações" [ref=e5] [cursor=pointer]
  - text:  
  - option "Com Textura" [selected]
  - option "Sem Textura (Sólido)"
  - option "Ativado" [selected]
  - option "Desativado"
  - option "Ativado" [selected]
  - option "Desativado"
  - option "Ativado" [selected]
  - option "Desativado"
  - text:  
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('Resource gain verification', async ({ page }) => {
  4  |   test.setTimeout(300000);
  5  |   await page.goto('http://localhost:8080/index.htm');
  6  |
  7  |   // Just trigger startGame directly to bypass potential UI issues
  8  |   await page.evaluate(() => {
  9  |     if (typeof startGame === 'function') {
  10 |         startGame();
  11 |     } else {
  12 |         document.getElementById('startButton').click();
  13 |     }
  14 |   });
  15 |
  16 |   // Wait for necessary globals to be defined
> 17 |   await page.waitForFunction(() => typeof window.addItemToInventory === 'function', { timeout: 60000 });
     |              ^ Error: page.waitForFunction: Test timeout of 300000ms exceeded.
  18 |
  19 |   // Test Dirt Gain (1 per stage)
  20 |   const dirtGain = await page.evaluate(() => {
  21 |     const initialDirt = (window.backpackItems.find(i => i && i.name === 'terra')?.quantity || 0);
  22 |     const x = 0; const z = 0;
  23 |     const intersect = {
  24 |       point: new window.THREE.Vector3(x, window.getSurfaceHeight(x, z), z),
  25 |       face: { normal: new window.THREE.Vector3(0, 1, 0) },
  26 |       object: new window.THREE.Mesh()
  27 |     };
  28 |     const mound = window.createMound(intersect, false);
  29 |     const currentDigHeight = mound.position.y + (mound.height || 0);
  30 |     const effectiveHeight = Math.min(mound.position.y, currentDigHeight);
  31 |     const distFromCenter = Math.sqrt(mound.position.x ** 2 + mound.position.z ** 2);
  32 |     let itemToGive;
  33 |     if (effectiveHeight < window.getSurfaceHeight(mound.position.x, mound.position.z) - 4.5) {
  34 |         itemToGive = 'pedra';
  35 |     } else if (distFromCenter > window.grassRadius) {
  36 |         itemToGive = 'areia';
  37 |     } else {
  38 |         itemToGive = 'terra';
  39 |     }
  40 |     window.addItemToInventory(window.backpackItems, { name: itemToGive, quantity: 1 });
  41 |     return (window.backpackItems.find(i => i && i.name === 'terra')?.quantity || 0) - initialDirt;
  42 |   });
  43 |   expect(dirtGain).toBe(1);
  44 |
  45 |   // Test Stone Gain from stone object (quantity: 10)
  46 |   const stoneGain = await page.evaluate(() => {
  47 |     const initialStone = (window.backpackItems.find(i => i && i.name === 'pedra')?.quantity || 0);
  48 |     const pos = new window.THREE.Vector3(0, 10, 0);
  49 |     window.createStone(pos, new window.THREE.Quaternion());
  50 |     const lastStone = window.collectibleBoxes[window.collectibleBoxes.length - 1];
  51 |     const itemQuantity = lastStone.body.userData.quantity || 1;
  52 |     window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: itemQuantity });
  53 |     return (window.backpackItems.find(i => i && i.name === 'pedra')?.quantity || 0) - initialStone;
  54 |   });
  55 |   expect(stoneGain).toBe(10);
  56 | });
  57 |
```