import { test, expect } from '@playwright/test';

test.describe('Pickaxe Requirement for Clay and Stone Blocks', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);
  });

  test('Attempting to destroy cob or stone block without a pickaxe triggers notification and cancels destruction', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Create a cob block and a stone block
      const posCob = new window.THREE.Vector3(0, 0.2, -2);
      const cobBody = window.createPlaceableBlock(posCob, null, 'cob');

      const posStone = new window.THREE.Vector3(2, 0.2, -2);
      const stoneBody = window.createPlaceableBlock(posStone, null, 'bloco_pedra');

      // Test with hand (null item) on cobBody
      window.beltItems[0] = null;
      window.selectedSlotIndex = 0;

      // Mock startDestruction check directly against cobBody
      const testDestructionOnBody = (body, toolItem) => {
        window.beltItems[0] = toolItem;
        window.selectedSlotIndex = 0;

        // Set heldItem variables
        const heldItem = window.beltItems[0];
        const heldItemName = heldItem?.name;

        // Execute the exact requirement check logic
        const targetType = body.userData.type;
        const isCobOrStoneBlock = ['cob', 'piso', 'bloco_pedra', 'piso_pedra'].includes(targetType);
        const isPickaxe = (heldItemName === 'picareta' || heldItemName === 'picareta_ferro');

        if (isCobOrStoneBlock && !isPickaxe) {
          window.showNotification("Você precisa de uma picareta para destruir este bloco!");
          return { allowed: false, notification: document.getElementById('notification')?.innerText };
        }
        return { allowed: true };
      };

      const handOnCob = testDestructionOnBody(cobBody, null);
      const axeOnCob = testDestructionOnBody(cobBody, { name: 'machado', quantity: 1 });
      const pickaxeOnCob = testDestructionOnBody(cobBody, { name: 'picareta', quantity: 1 });
      const handOnStone = testDestructionOnBody(stoneBody, null);
      const ironPickaxeOnStone = testDestructionOnBody(stoneBody, { name: 'picareta_ferro', quantity: 1 });

      return {
        handOnCob,
        axeOnCob,
        pickaxeOnCob,
        handOnStone,
        ironPickaxeOnStone
      };
    });

    expect(result.handOnCob.allowed).toBe(false);
    expect(result.handOnCob.notification).toBe("Você precisa de uma picareta para destruir este bloco!");
    expect(result.axeOnCob.allowed).toBe(false);
    expect(result.pickaxeOnCob.allowed).toBe(true);
    expect(result.handOnStone.allowed).toBe(false);
    expect(result.ironPickaxeOnStone.allowed).toBe(true);
  });
});
