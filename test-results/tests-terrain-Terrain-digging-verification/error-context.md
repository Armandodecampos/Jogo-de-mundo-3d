# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/terrain.spec.js >> Terrain digging verification
- Location: tests/terrain.spec.js:3:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 120000ms exceeded.
```

# Page snapshot

```yaml
- generic:
  - generic [ref=e1]:
    - heading "Small World" [level=1] [ref=e2]
    - generic [ref=e3]:
      - button "Jogar" [active] [ref=e4] [cursor=pointer]
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
  3  | test('Terrain digging verification', async ({ page }) => {
  4  |   test.setTimeout(120000);
  5  |   await page.goto('http://localhost:8080/index.htm');
  6  |   await page.click('#startButton');
  7  |
  8  |   // Wait for world to be ready (increased timeout for asset loading)
> 9  |   await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
     |              ^ Error: page.waitForFunction: Test timeout of 120000ms exceeded.
  10 |
  11 |   // Verify worldSize
  12 |   const worldSize = await page.evaluate(() => window.worldSize);
  13 |   expect(worldSize).toBe(1200);
  14 |
  15 |   // Check if islandMeshes are present
  16 |   const islandMeshCount = await page.evaluate(() => window.islandMeshes.length);
  17 |   expect(islandMeshCount).toBe(9);
  18 |
  19 |   // Try to create a mound (digging) - mock dependencies if necessary
  20 |   await page.evaluate(() => {
  21 |     // If assets not loaded yet, mock them for the test to avoid null check failure
  22 |     if (!window.holeGeometryTemplate) {
  23 |         window.holeGeometryTemplate = new window.THREE.SphereGeometry(0.1);
  24 |         window.holeMaterial = new window.THREE.MeshBasicMaterial({ color: 0x000000 });
  25 |     }
  26 |     const intersect = {
  27 |       point: new window.THREE.Vector3(0, 0.8, 0),
  28 |       face: { normal: new window.THREE.Vector3(0, 1, 0) },
  29 |       object: window.islandMeshes[4].mesh
  30 |     };
  31 |     window.createMound(intersect, false);
  32 |   });
  33 |
  34 |   const moundCount = await page.evaluate(() => window.mounds.length);
  35 |   expect(moundCount).toBeGreaterThan(0);
  36 | });
  37 |
```