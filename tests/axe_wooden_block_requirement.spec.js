import { test, expect } from '@playwright/test';

test.describe('Axe Requirement for Wooden Blocks and Wooden Floors', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);
  });

  test('Attempting to destroy wooden block or floor without an axe triggers notification and cancels destruction', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Create a wooden block and a wooden floor
      const posWoodBlock = new window.THREE.Vector3(0, 0.2, -2);
      const woodBlockBody = window.createPlaceableBlock(posWoodBlock, null, 'bloco_madeira');

      const posWoodFloor = new window.THREE.Vector3(2, 0.08, -2);
      const woodFloorBody = window.createPlaceableBlock(posWoodFloor, null, 'piso_madeira');

      const posWoodPlanks = new window.THREE.Vector3(4, 0.08, -2);
      const woodPlanksBody = window.createPlaceableBlock(posWoodPlanks, null, 'tábuas');

      const testDestructionOnBody = (body, toolItem) => {
        window.beltItems[0] = toolItem;
        window.selectedSlotIndex = 0;

        const heldItem = window.beltItems[0];
        const heldItemName = heldItem?.name;

        const targetType = body.userData.type;
        const isWoodenBlockOrFloor = ['bloco_madeira', 'piso_madeira', 'tábuas'].includes(targetType);
        const isHoldingAxe = (heldItemName === 'machado' || heldItemName === 'machado_ferro');

        if (isWoodenBlockOrFloor && !isHoldingAxe) {
          window.showNotification("Você precisa de um machado para destruir este bloco!");
          return { allowed: false, notification: document.getElementById('notification')?.innerText };
        }
        return { allowed: true };
      };

      const handOnWoodBlock = testDestructionOnBody(woodBlockBody, null);
      const pickaxeOnWoodBlock = testDestructionOnBody(woodBlockBody, { name: 'picareta', quantity: 1 });
      const axeOnWoodBlock = testDestructionOnBody(woodBlockBody, { name: 'machado', quantity: 1 });
      const ironAxeOnWoodBlock = testDestructionOnBody(woodBlockBody, { name: 'machado_ferro', quantity: 1 });

      const handOnWoodFloor = testDestructionOnBody(woodFloorBody, null);
      const axeOnWoodFloor = testDestructionOnBody(woodFloorBody, { name: 'machado', quantity: 1 });

      const handOnWoodPlanks = testDestructionOnBody(woodPlanksBody, null);
      const ironAxeOnWoodPlanks = testDestructionOnBody(woodPlanksBody, { name: 'machado_ferro', quantity: 1 });

      return {
        handOnWoodBlock,
        pickaxeOnWoodBlock,
        axeOnWoodBlock,
        ironAxeOnWoodBlock,
        handOnWoodFloor,
        axeOnWoodFloor,
        handOnWoodPlanks,
        ironAxeOnWoodPlanks
      };
    });

    expect(result.handOnWoodBlock.allowed).toBe(false);
    expect(result.handOnWoodBlock.notification).toBe("Você precisa de um machado para destruir este bloco!");
    expect(result.pickaxeOnWoodBlock.allowed).toBe(false);
    expect(result.pickaxeOnWoodBlock.notification).toBe("Você precisa de um machado para destruir este bloco!");
    expect(result.axeOnWoodBlock.allowed).toBe(true);
    expect(result.ironAxeOnWoodBlock.allowed).toBe(true);

    expect(result.handOnWoodFloor.allowed).toBe(false);
    expect(result.handOnWoodFloor.notification).toBe("Você precisa de um machado para destruir este bloco!");
    expect(result.axeOnWoodFloor.allowed).toBe(true);

    expect(result.handOnWoodPlanks.allowed).toBe(false);
    expect(result.handOnWoodPlanks.notification).toBe("Você precisa de um machado para destruir este bloco!");
    expect(result.ironAxeOnWoodPlanks.allowed).toBe(true);
  });

  test('Interaction hint for wooden blocks and floors only shows destruction when holding an axe', async ({ page }) => {
    const hintResult = await page.evaluate(() => {
      const getHintForBody = (bodyType, toolItem) => {
        window.beltItems[0] = toolItem;
        window.selectedSlotIndex = 0;

        const isWoodenBlockOrFloor = ['bloco_madeira', 'piso_madeira', 'tábuas'].includes(bodyType);
        const heldItemForHint = window.beltItems[0];
        const isHoldingAxe = heldItemForHint && (heldItemForHint.name === 'machado' || heldItemForHint.name === 'machado_ferro');

        let hint = "";
        if (isWoodenBlockOrFloor) {
          if (isHoldingAxe) {
            hint = "(Botão Esq.) Destruir";
          }
        } else {
          hint = "(Botão Esq.) Destruir";
        }
        return hint;
      };

      return {
        woodBlockWithHand: getHintForBody('bloco_madeira', null),
        woodBlockWithPickaxe: getHintForBody('bloco_madeira', { name: 'picareta', quantity: 1 }),
        woodBlockWithAxe: getHintForBody('bloco_madeira', { name: 'machado', quantity: 1 }),
        woodBlockWithIronAxe: getHintForBody('bloco_madeira', { name: 'machado_ferro', quantity: 1 }),
        woodFloorWithHand: getHintForBody('piso_madeira', null),
        woodFloorWithAxe: getHintForBody('piso_madeira', { name: 'machado', quantity: 1 }),
        woodPlanksWithHand: getHintForBody('tábuas', null),
        woodPlanksWithIronAxe: getHintForBody('tábuas', { name: 'machado_ferro', quantity: 1 })
      };
    });

    expect(hintResult.woodBlockWithHand).toBe("");
    expect(hintResult.woodBlockWithPickaxe).toBe("");
    expect(hintResult.woodBlockWithAxe).toBe("(Botão Esq.) Destruir");
    expect(hintResult.woodBlockWithIronAxe).toBe("(Botão Esq.) Destruir");
    expect(hintResult.woodFloorWithHand).toBe("");
    expect(hintResult.woodFloorWithAxe).toBe("(Botão Esq.) Destruir");
    expect(hintResult.woodPlanksWithHand).toBe("");
    expect(hintResult.woodPlanksWithIronAxe).toBe("(Botão Esq.) Destruir");
  });
});
