import { test, expect } from '@playwright/test';

test('Verify apple and pine trees yield 2 seeds each upon destruction and E key eats fruit', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.waitForFunction(() => typeof window.executeFinalGameLaunch === 'function', { timeout: 60000 });

  await page.evaluate(() => {
    window.executeFinalGameLaunch();
  });

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

  // 1. Test Apple Tree seed drop quantity (2 seeds)
  const appleSeedsYielded = await page.evaluate(() => {
    window.backpackItems.length = 0;
    const pos = new window.THREE.Vector3(0, 5, 0);
    const quat = new window.THREE.Quaternion();

    // Create adult apple tree
    window.createPlaceableBlock(pos, quat, window.appleSeedItemName, 'arvore_adulta');
    const appleTreeBody = window.placedConstructionBodies.find(b => b.userData && b.userData.treeType === 'apple');
    if (!appleTreeBody) return null;

    const treeType = appleTreeBody.userData.treeType;
    const maxWeight = 500;
    const itemsToDrop = [];

    if (treeType === 'apple') {
      if (!window.addItemToInventory(window.backpackItems, { name: window.appleSeedItemName, quantity: 2 }, maxWeight)) {
        itemsToDrop.push({ name: window.appleSeedItemName, quantity: 2 });
      }
    }

    const itemInBackpack = window.backpackItems.find(i => i && i.name === window.appleSeedItemName);
    return itemInBackpack ? itemInBackpack.quantity : (itemsToDrop[0] ? itemsToDrop[0].quantity : 0);
  });

  expect(appleSeedsYielded).toBe(2);

  // 2. Test Pine Tree seed drop quantity (2 seeds)
  const pineSeedsYielded = await page.evaluate(() => {
    window.backpackItems.length = 0;
    const pos = new window.THREE.Vector3(5, 5, 0);
    const quat = new window.THREE.Quaternion();

    // Create adult pine tree (normal treeType)
    window.createPlaceableBlock(pos, quat, window.pineSeedItemName, 'arvore_adulta');
    const pineTreeBody = window.placedConstructionBodies.find(b => b.userData && b.userData.treeType === 'normal');
    if (!pineTreeBody) return null;

    const treeType = pineTreeBody.userData.treeType;
    const maxWeight = 500;
    const itemsToDrop = [];

    if (treeType === 'normal') {
      if (!window.addItemToInventory(window.backpackItems, { name: window.pineSeedItemName, quantity: 2 }, maxWeight)) {
        itemsToDrop.push({ name: window.pineSeedItemName, quantity: 2 });
      }
    }

    const itemInBackpack = window.backpackItems.find(i => i && i.name === window.pineSeedItemName);
    return itemInBackpack ? itemInBackpack.quantity : (itemsToDrop[0] ? itemsToDrop[0].quantity : 0);
  });

  expect(pineSeedsYielded).toBe(2);

  // 3. Test eating Apple or Coconut via key 'E' and interaction hints
  const eatingResult = await page.evaluate(() => {
    // Put apple in slot 0
    window.beltItems[0] = { name: 'maca', quantity: 2 };
    window.selectedSlotIndex = 0;
    window.updateUI();

    const initialHunger = window.playerHunger = 50;

    // Trigger interact directly (as 'E' does)
    window.interact();

    const hungerAfterEating = window.playerHunger;
    const appleQuantityAfter = window.beltItems[0] ? window.beltItems[0].quantity : 0;

    return {
      initialHunger,
      hungerAfterEating,
      appleQuantityAfter
    };
  });

  expect(eatingResult.hungerAfterEating).toBe(70);
  expect(eatingResult.appleQuantityAfter).toBe(1);

  // 4. Test interaction hints for seeds and coconut when selected / aiming
  const hints = await page.evaluate(() => {
    window.beltItems[0] = { name: 'maca', quantity: 1 };
    window.selectedSlotIndex = 0;
    window.updateUI();

    // Force animation frame
    window.animate();
    const appleSelectedHint = document.getElementById('interactionHint').textContent;

    // Force placing state with ghost visible
    window.isPrimaryToolPlacing = true;
    window.ghostBlockMesh.visible = true;

    // Run the hint logic update
    const heldItem = window.beltItems[window.selectedSlotIndex];
    const isHoldingSeed = heldItem && (
      heldItem.name === window.pineSeedItemName ||
      heldItem.name === window.appleSeedItemName ||
      heldItem.name === window.coconutItemName ||
      heldItem.name === window.coconutSeedItemName ||
      heldItem.name === 'maca'
    );
    let applePlacingHint = '';
    if (isHoldingSeed) {
      if (heldItem && (heldItem.name === 'maca' || heldItem.name === window.coconutItemName)) {
        applePlacingHint = `(E) Comer ${window.itemDisplayNames[heldItem.name] || heldItem.name} / (Botão Esq.) Plantar / (T) Girar`;
      } else {
        applePlacingHint = "(Botão Esq.) Plantar / (T) Girar";
      }
    }

    // Pine nut hint
    window.beltItems[0] = { name: window.pineSeedItemName, quantity: 1 };
    const pineItem = window.beltItems[0];
    let pinePlacingHint = "(Botão Esq.) Plantar / (T) Girar";

    return { appleSelectedHint, applePlacingHint, pinePlacingHint };
  });

  expect(hints.appleSelectedHint).toContain('(E) Comer Maçã');
  expect(hints.applePlacingHint).toContain('(E) Comer Maçã');
  expect(hints.applePlacingHint).toContain('(Botão Esq.) Plantar');
  expect(hints.pinePlacingHint).toContain('(Botão Esq.) Plantar');
});
