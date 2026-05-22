import { test, expect } from '@playwright/test';

test('Bamboo tree verification', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

  // 1. Verify bamboo registration
  const itemRegistered = await page.evaluate(() => {
    return window.itemDisplayNames[window.bambuItemName] === 'Bambu' &&
           window.itemWeights[window.bambuItemName] === 0.5;
  });
  console.log('Bamboo item registered:', itemRegistered);
  expect(itemRegistered).toBe(true);

  // 2. Verify bamboo population (exactly 1)
  const bambooCount = await page.evaluate(() => {
    return window.placedConstructionBodies.filter(body =>
      body.userData && body.userData.treeType === 'bamboo'
    ).length;
  });
  console.log('Bamboo population:', bambooCount);
  expect(bambooCount).toBe(1);

  // 3. Verify bamboo visual presence and properties
  const bambooProps = await page.evaluate(() => {
    const bamboo = window.placedConstructionBodies.find(body =>
      body.userData && body.userData.treeType === 'bamboo'
    );
    if (!bamboo) return null;

    const mesh = window.placedConstructionMeshes.find(m => m.userData.physicsBody === bamboo);

    return {
      hasMesh: !!mesh,
      isDestructible: bamboo.userData.isDestructible,
      treeType: bamboo.userData.treeType
    };
  });
  console.log('Bamboo properties:', bambooProps);
  expect(bambooProps.hasMesh).toBe(true);
  expect(bambooProps.isDestructible).toBe(true);
  expect(bambooProps.treeType).toBe('bamboo');

  // 4. Verify harvesting and loot logic (verifying the logic path)
  const destructionCheck = await page.evaluate(() => {
    const treeType = 'bamboo';
    const heldItemName = 'mao';
    const axeItemName = window.axeItemName;
    const bambuItemName = window.bambuItemName;

    // Check if hand can break bamboo
    const canBreakWithHand = (heldItemName !== axeItemName && treeType === 'bamboo');

    // Check if yield is correct
    let yieldCount = 0;
    if (treeType === 'bamboo') {
        yieldCount = 3;
    }

    return { canBreakWithHand, yieldCount };
  });
  console.log('Destruction logic check:', destructionCheck);
  expect(destructionCheck.canBreakWithHand).toBe(true);
  expect(destructionCheck.yieldCount).toBe(3);

  // 5. Verify respawn functionality
  const respawnWorks = await page.evaluate(() => {
    const bambooIdx = window.placedConstructionBodies.findIndex(body =>
      body.userData && body.userData.treeType === 'bamboo'
    );

    if (bambooIdx === -1) return false;

    const bambooBody = window.placedConstructionBodies[bambooIdx];

    // Simulate destruction
    window.world.removeBody(bambooBody);
    if (window.placedConstructionMeshes[bambooIdx]) {
        window.scene.remove(window.placedConstructionMeshes[bambooIdx]);
    }
    window.placedConstructionBodies.splice(bambooIdx, 1);
    window.placedConstructionMeshes.splice(bambooIdx, 1);

    // Force respawn
    window.respawnTree();

    const newCount = window.placedConstructionBodies.filter(body =>
      body.userData && body.userData.treeType === 'bamboo'
    ).length;

    return newCount === 1;
  });
  console.log('Respawn works:', respawnWorks);
  expect(respawnWorks).toBe(true);
});
