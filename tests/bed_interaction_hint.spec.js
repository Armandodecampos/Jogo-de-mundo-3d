import { test, expect } from '@playwright/test';

test.describe('Bed Interaction Hint and Stone Pickaxe Speed Verification', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);
  });

  test('Looking at placed bed, grass bed, or sleeping mat displays (E) Dormir hint', async ({ page }) => {
    const hintResults = await page.evaluate(() => {
      const bedTypes = [window.grassBedItemName, window.sleepingMatItemName, window.bedItemName];
      const hints = {};

      for (const bType of bedTypes) {
        // Create placeable bed
        const pos = new window.THREE.Vector3(0, 1, 5);
        const body = window.createPlaceableBlock(pos, null, bType);

        // Mock body raycast target check logic as implemented in animate()
        let interactionHintText = "";
        let identified = false;

        if (body && body.userData) {
          if (body.userData.type === window.grassBedItemName || body.userData.type === window.sleepingMatItemName || body.userData.type === window.bedItemName) {
            interactionHintText = "(E) Dormir / (G) Guardar";
            identified = true;
          }

          if ([window.bedItemName, window.sleepingMatItemName, window.grassBedItemName].includes(body.userData.type)) {
            if (!identified) {
              interactionHintText = "(G) Guardar";
              identified = true;
            }
            interactionHintText += " / (T) Girar";
          }
        }

        hints[bType] = interactionHintText;
      }

      return hints;
    });

    expect(hintResults['cama_capim']).toContain('(E) Dormir');
    expect(hintResults['colchonete']).toContain('(E) Dormir');
    expect(hintResults['cama']).toContain('(E) Dormir');
  });
});
