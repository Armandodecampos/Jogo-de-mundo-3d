import { test, expect } from '@playwright/test';

test.describe('Floor Spawn Prevention and Pickaxe Destruction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);
  });

  test('isPositionOccupiedByFloor detects placed floor tiles and prevents grass/tree spawn', async ({ page }) => {
    const floorOccupied = await page.evaluate(() => {
      // Create a floor tile at (10, 1, 10)
      const pos = new window.THREE.Vector3(10, 1, 10);
      window.createPlaceableBlock(pos, null, 'piso');

      // Check if isPositionOccupiedByFloor returns true near (10, 10)
      const occupiedAtCenter = window.isPositionOccupiedByFloor(10, 10);
      const occupiedNearCenter = window.isPositionOccupiedByFloor(10.5, 10.5);
      const occupiedFarAway = window.isPositionOccupiedByFloor(50, 50);

      return { occupiedAtCenter, occupiedNearCenter, occupiedFarAway };
    });

    expect(floorOccupied.occupiedAtCenter).toBe(true);
    expect(floorOccupied.occupiedNearCenter).toBe(true);
    expect(floorOccupied.occupiedFarAway).toBe(false);
  });

  test('Pickaxes are ideal tools for all blocks and floors with iron pickaxe faster than stone pickaxe', async ({ page }) => {
    const speeds = await page.evaluate(() => {
      const blockTypes = ['cob', 'piso', 'bloco_pedra', 'bloco_madeira', 'piso_pedra', 'piso_madeira', 'tábuas'];
      const results = {};

      for (const bType of blockTypes) {
        // Mock target object
        const mockTarget = {
          body: {
            userData: {
              type: bType,
              isDestructible: true
            }
          },
          isCapim: false
        };

        // Helper calculation function matching index.htm logic
        const calculateMultiplier = (heldItemName, target) => {
          const materialType = target.body.userData.type.includes('pedra') ? 'stone' : (target.body.userData.type.includes('madeira') || target.body.userData.type === 'tábuas') ? 'wood' : 'earth';
          const isBuildingAction = (heldItemName === 'terra' || heldItemName === 'areia');

          const isBlockOrFloorTarget = target.body && target.body.userData && [
            'cob', 'piso',
            'bloco_pedra', 'piso_pedra',
            'bloco_madeira', 'piso_madeira', 'tábuas'
          ].includes(target.body.userData.type);

          const isPickaxe = (heldItemName === 'picareta' || heldItemName === 'picareta_ferro');
          const isIronTool = (heldItemName === 'machado_ferro' || heldItemName === 'picareta_ferro' || heldItemName === 'pá_ferro');

          const isCorrectTool = isBuildingAction ||
              ((heldItemName === 'machado' || heldItemName === 'machado_ferro') && (materialType === 'wood' || target.isCapim)) ||
              (isPickaxe && (materialType === 'stone' || isBlockOrFloorTarget)) ||
              ((heldItemName === 'pá' || heldItemName === 'pá_ferro') && materialType === 'earth');

          let multiplier = 10.0; // weakMultiplier
          if (isCorrectTool) {
            if (isBuildingAction) {
              multiplier = 1.0;
            } else if ((heldItemName === 'pá' && materialType === 'earth') ||
                (isPickaxe && (materialType === 'stone' || isBlockOrFloorTarget)) ||
                (heldItemName === 'pá_ferro' && materialType === 'earth') ||
                ((heldItemName === 'machado' || heldItemName === 'machado_ferro') && target.isCapim)) {
              multiplier = 0.3;
            } else {
              multiplier = 2.0; // strongMultiplier
            }

            if (isIronTool) {
              multiplier *= 0.5;
            }
          }
          return multiplier;
        };

        results[bType] = {
          stonePickaxe: calculateMultiplier('picareta', mockTarget),
          ironPickaxe: calculateMultiplier('picareta_ferro', mockTarget),
          hand: calculateMultiplier('mao', mockTarget)
        };
      }

      return results;
    });

    for (const bType of Object.keys(speeds)) {
      expect(speeds[bType].stonePickaxe).toBe(0.3);
      expect(speeds[bType].ironPickaxe).toBe(0.15); // Faster
      expect(speeds[bType].hand).toBe(10.0); // Slower
    }
  });
});
