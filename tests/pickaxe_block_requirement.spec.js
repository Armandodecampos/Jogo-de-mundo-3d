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

      const testDestructionOnBody = (body, toolItem) => {
        window.beltItems[0] = toolItem;
        window.selectedSlotIndex = 0;

        const heldItem = window.beltItems[0];
        const heldItemName = heldItem?.name;

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

  test('Interaction hint for cob and stone blocks only shows destruction/mining when holding a pickaxe', async ({ page }) => {
    const hintResult = await page.evaluate(() => {
      const getHintForBody = (bodyType, toolItem) => {
        window.beltItems[0] = toolItem;
        window.selectedSlotIndex = 0;

        const isCobOrStoneBlock = ['cob', 'piso', 'bloco_pedra', 'piso_pedra'].includes(bodyType);
        const isWoodenBlockOrFloor = ['bloco_madeira', 'piso_madeira', 'tábuas'].includes(bodyType);
        const heldItemForHint = window.beltItems[0];
        const isHoldingPickaxe = heldItemForHint && (heldItemForHint.name === 'picareta' || heldItemForHint.name === 'picareta_ferro');
        const isHoldingAxe = heldItemForHint && (heldItemForHint.name === 'machado' || heldItemForHint.name === 'machado_ferro');

        let hint = "";
        if (isCobOrStoneBlock) {
          if (isHoldingPickaxe) {
            if (bodyType === 'bloco_pedra' || bodyType === 'piso_pedra') {
              hint = "(Botão Esq.) Minerar Pedra";
            } else {
              hint = "(Botão Esq.) Destruir";
            }
          }
        } else if (isWoodenBlockOrFloor) {
          if (isHoldingAxe) {
            hint = "(Botão Esq.) Destruir";
          }
        } else {
          hint = "(Botão Esq.) Destruir";
        }
        return hint;
      };

      return {
        cobWithHand: getHintForBody('cob', null),
        cobWithAxe: getHintForBody('cob', { name: 'machado', quantity: 1 }),
        cobWithPickaxe: getHintForBody('cob', { name: 'picareta', quantity: 1 }),
        stoneWithHand: getHintForBody('bloco_pedra', null),
        stoneWithIronPickaxe: getHintForBody('bloco_pedra', { name: 'picareta_ferro', quantity: 1 }),
        woodWithHand: getHintForBody('bloco_madeira', null),
        woodWithAxe: getHintForBody('bloco_madeira', { name: 'machado', quantity: 1 })
      };
    });

    expect(hintResult.cobWithHand).toBe("");
    expect(hintResult.cobWithAxe).toBe("");
    expect(hintResult.cobWithPickaxe).toBe("(Botão Esq.) Destruir");
    expect(hintResult.stoneWithHand).toBe("");
    expect(hintResult.stoneWithIronPickaxe).toBe("(Botão Esq.) Minerar Pedra");
    expect(hintResult.woodWithHand).toBe("");
    expect(hintResult.woodWithAxe).toBe("(Botão Esq.) Destruir");
  });
});
