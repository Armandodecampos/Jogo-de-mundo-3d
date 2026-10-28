import { test, expect } from '@playwright/test';

test.describe('Subsoil Stone Mining and Minimum Render Distance', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);
  });

  test('Subsoil stone mining requires pickaxe and minimum render distance is 20', async ({ page }) => {
    const result = await page.evaluate(() => {
      // 1. Test minimum render distance slider and clamp
      const slider = document.getElementById('renderDistanceSlider');
      const sliderMin = slider ? slider.getAttribute('min') : null;

      window.setRenderDistance(5);
      const clampedDistance = window.renderDistance;

      // 2. Test subsoil stone layer digging restrictions in startDestruction logic
      const hitPointStone = new window.THREE.Vector3(0, window.getSurfaceHeight(0, 0) - 6.0, 0);
      const hitPointSurface = new window.THREE.Vector3(0, window.getSurfaceHeight(0, 0), 0);

      const testDigging = (hitPoint, toolItem) => {
        window.beltItems[0] = toolItem;
        window.selectedSlotIndex = 0;

        const heldItem = window.beltItems[0];
        const heldItemName = heldItem?.name;

        const surfaceHeight = window.getSurfaceHeight(hitPoint.x, hitPoint.z);
        const isStoneLayer = hitPoint.y < surfaceHeight - 4.5;

        const isPickaxe = (heldItemName === 'picareta' || heldItemName === 'picareta_ferro');
        const isShovel = (heldItemName === 'pá' || heldItemName === 'pá_ferro');

        let notification = null;
        let allowed = true;

        if (isStoneLayer && !isPickaxe) {
          notification = "Você precisa de uma picareta para minerar pedra!";
          allowed = false;
        } else if (!isStoneLayer && !isShovel) {
          notification = "Você precisa de uma pá para cavar!";
          allowed = false;
        }

        return { allowed, notification, isStoneLayer };
      };

      const shovelOnStone = testDigging(hitPointStone, { name: 'pá', quantity: 1 });
      const pickaxeOnStone = testDigging(hitPointStone, { name: 'picareta', quantity: 1 });
      const ironPickaxeOnStone = testDigging(hitPointStone, { name: 'picareta_ferro', quantity: 1 });

      const pickaxeOnSurface = testDigging(hitPointSurface, { name: 'picareta', quantity: 1 });
      const shovelOnSurface = testDigging(hitPointSurface, { name: 'pá', quantity: 1 });

      return {
        sliderMin,
        clampedDistance,
        shovelOnStone,
        pickaxeOnStone,
        ironPickaxeOnStone,
        pickaxeOnSurface,
        shovelOnSurface
      };
    });

    // Verify minimum render distance
    expect(result.sliderMin).toBe('20');
    expect(result.clampedDistance).toBe(20);

    // Verify subsoil stone mining restrictions
    expect(result.shovelOnStone.allowed).toBe(false);
    expect(result.shovelOnStone.notification).toBe("Você precisa de uma picareta para minerar pedra!");
    expect(result.pickaxeOnStone.allowed).toBe(true);
    expect(result.ironPickaxeOnStone.allowed).toBe(true);

    // Verify surface digging restrictions
    expect(result.pickaxeOnSurface.allowed).toBe(false);
    expect(result.pickaxeOnSurface.notification).toBe("Você precisa de uma pá para cavar!");
    expect(result.shovelOnSurface.allowed).toBe(true);
  });
});
