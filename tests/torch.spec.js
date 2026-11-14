const { test, expect } = require('@playwright/test');

test('crafted torch starts full and its fuel lasts five times longer than a campfire', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true);

    await page.evaluate(() => {
        const ingredients = [
            { name: 'galho', quantity: 1 },
            { name: 'tecido', quantity: 1 },
            { name: 'oleo_vegetal', quantity: 1 }
        ];
        ingredients.forEach(item =>
            window.addItemToInventory(window.backpackItems, item, Infinity, true)
        );
        window.openCraftingMenu('initial');
        const torchRecipe = [...document.querySelectorAll('#recipesContainer .recipe-item')]
            .find(element => element.querySelector('.recipe-name').textContent.includes('Tocha'));
        torchRecipe.querySelector('.craft-button').click();
    });

    const craftedTorch = await page.evaluate(() => {
        const torch = window.backpackItems.find(item => item && item.name === 'tocha');
        return { fuel: torch.fuel, isOn: torch.isOn };
    });
    expect(craftedTorch).toEqual({ fuel: 100, isOn: false });

    const fuelLoss = await page.evaluate(async () => {
        window.closeCraftingMenu();
        window.addItemToInventory(
            window.beltItems,
            { name: 'tocha', quantity: 1, fuel: 100, isOn: true },
            Infinity,
            true
        );
        window.selectedSlotIndex = window.beltItems.findIndex(item => item && item.name === 'tocha');
        const heldTorch = window.beltItems[window.selectedSlotIndex];

        const position = new window.THREE.Vector3(10, window.getSurfaceHeight(10, 10) + 0.4, 10);
        const torch = window.createPlaceableBlock(
            position, null, 'tocha', null, { fuel: 100, isOn: true }
        );
        const campfire = window.createPlaceableBlock(
            new window.THREE.Vector3(12, window.getSurfaceHeight(12, 10) + 0.25, 10),
            null,
            'fogueira',
            null,
            { fuel: 100, isOn: true }
        );
        const initialHeldFuel = heldTorch.fuel;
        const initialTorchFuel = torch.userData.fuel;
        const initialCampfireFuel = campfire.userData.fuel;

        await new Promise(resolve => setTimeout(resolve, 3000));

        return {
            heldTorch: initialHeldFuel - heldTorch.fuel,
            placedTorch: initialTorchFuel - torch.userData.fuel,
            campfire: initialCampfireFuel - campfire.userData.fuel
        };
    });

    expect(fuelLoss.heldTorch).toBeGreaterThan(0);
    expect(fuelLoss.placedTorch).toBeGreaterThan(0);
    expect(fuelLoss.campfire / fuelLoss.heldTorch).toBeCloseTo(5, 0);
    expect(fuelLoss.campfire / fuelLoss.placedTorch).toBeCloseTo(5, 0);
});

test('Torch item exists and can be held', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Give torch to player and select it
    await page.evaluate(() => {
        window.addItemToInventory(window.beltItems, { name: 'tocha', quantity: 10 });
        const torchIdx = window.beltItems.findIndex(item => item && item.name === 'tocha');
        if (torchIdx !== -1) {
            window.selectedSlotIndex = torchIdx;
        }
        window.updateUI();
    });

    await page.waitForTimeout(1000);

    // Verify heldTorchGroup is visible
    const isHeldTorchVisible = await page.evaluate(() => {
        return window.heldTorchGroup && window.heldTorchGroup.visible;
    });
    expect(isHeldTorchVisible).toBe(true);
});

test('Torch item can be placed', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Give torch to player and select it
    await page.evaluate(() => {
        window.addItemToInventory(window.beltItems, { name: 'tocha', quantity: 10 });
        const torchIdx = window.beltItems.findIndex(item => item && item.name === 'tocha');
        if (torchIdx !== -1) {
            window.selectedSlotIndex = torchIdx;
        }
        window.updateUI();
    });

    await page.waitForTimeout(500);

    // Force place torch via direct function call for testing
    await page.evaluate(() => {
        const pos = new window.THREE.Vector3(0, window.getSurfaceHeight(0, -2) + 0.4, -2);
        const quat = new window.THREE.Quaternion();
        window.createPlaceableBlock(pos, quat, 'tocha');
    });

    await page.waitForTimeout(1000);

    // Check if a torch was added to activeCampfires
    const hasPlacedTorch = await page.evaluate(() => {
        return window.activeCampfires && window.activeCampfires.some(cf => cf.userData.type === 'tocha');
    });
    expect(hasPlacedTorch).toBe(true);
});
