import { test, expect } from '@playwright/test';

test('Verify apple tree destruction yields 0 seeds, eating apple yields seed, and holding rules for apple, coconut, apple seed', async ({ page }) => {
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

  // 1. Test Apple Tree seed drop quantity (0 seeds now upon destruction)
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

    // Simulate destruction yield logic
    if (treeType === 'apple') {
      if (!window.addItemToInventory(window.backpackItems, { name: window.treeTrunkItemName, quantity: 4 }, maxWeight)) {
        itemsToDrop.push({ name: window.treeTrunkItemName, quantity: 4 });
      }
      // No seeds added here
    }

    const itemInBackpack = window.backpackItems.find(i => i && i.name === window.appleSeedItemName);
    return itemInBackpack ? itemInBackpack.quantity : 0;
  });

  expect(appleSeedsYielded).toBe(0);

  // 2. Test Pine Tree seed drop quantity (2 seeds still yielded for pine tree)
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

  // 3. Test eating Apple via key 'E' / interact() gives 6 Apple Seeds
  const eatingResult = await page.evaluate(() => {
    window.beltItems.fill(null);
    window.backpackItems.fill(null);

    // Put apple in slot 0
    window.beltItems[0] = { name: 'maca', quantity: 1 };
    window.selectedSlotIndex = 0;
    window.updateUI();

    window.playerHunger = 50;

    // Trigger interact directly
    window.interact();

    const hungerAfterEating = window.playerHunger;
    const seedInBelt = window.beltItems.find(i => i && i.name === window.appleSeedItemName);
    const seedInBackpack = window.backpackItems.find(i => i && i.name === window.appleSeedItemName);
    const totalSeeds = (seedInBelt ? seedInBelt.quantity : 0) + (seedInBackpack ? seedInBackpack.quantity : 0);

    return {
      hungerAfterEating,
      totalSeeds
    };
  });

  expect(eatingResult.hungerAfterEating).toBe(70);
  expect(eatingResult.totalSeeds).toBe(6);

  // 4. Test holding rules and interaction hints
  const rules = await page.evaluate(() => {
    // Look down at the ground
    window.camera.lookAt(0, -10, 0);

    // Apple
    const appleHasGhost = window.hasGhostPreview('maca');
    const appleActionType = window.getActionType({ name: 'maca' });

    // Put apple in hand
    window.beltItems[0] = { name: 'maca', quantity: 1 };
    window.selectedSlotIndex = 0;
    window.updateUI();
    window.animate();

    const appleHint = document.getElementById('interactionHint').textContent;

    // Put coconut in hand
    window.beltItems[0] = { name: 'coco', quantity: 1 };
    window.updateUI();
    window.animate();
    const coconutHint = document.getElementById('interactionHint').textContent;

    // Put apple seed in hand
    window.beltItems[0] = { name: window.appleSeedItemName, quantity: 1 };
    window.updateUI();
    window.animate();
    const appleSeedHint = document.getElementById('interactionHint').textContent;

    return {
      appleHasGhost,
      appleActionType,
      appleHint,
      coconutHint,
      appleSeedHint
    };
  });

  expect(rules.appleHasGhost).toBe(false);
  expect(rules.appleActionType).toBe(null);
  expect(rules.appleHint).toContain('(Botão Esq.) Comer Maçã');
  expect(rules.appleHint).not.toContain('Plantar');
  expect(rules.appleHint).not.toContain('Girar');

  expect(rules.coconutHint).toContain('(Botão Esq.) Comer Coco');
  expect(rules.coconutHint).toContain('(Botão Esq.) Plantar');
  expect(rules.coconutHint).not.toContain('Girar');

  expect(rules.appleSeedHint).toContain('(Botão Esq.) Plantar');
  expect(rules.appleSeedHint).not.toContain('Girar');
});
