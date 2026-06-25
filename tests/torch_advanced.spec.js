const { test, expect } = require('@playwright/test');

test('Torch fuel state preservation lifecycle', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Check actual constant names
    const constants = await page.evaluate(() => {
        return {
            torch: window.torchItemName,
            fabric: window.fabricItemName,
            oil: window.vegetableOilItemName
        };
    });

    await page.evaluate((c) => {
        // Clear belt and backpack
        for(let i=0; i<window.beltItems.length; i++) window.beltItems[i] = null;
        while(window.backpackItems.length > 0) window.backpackItems.pop();
        for(let i=0; i<20; i++) window.backpackItems.push(null);

        // Setup items manually
        window.beltItems[1] = { name: c.torch, quantity: 1, fuel: 50, isOn: true };
        // Put fuel ingredients in the BELT to test the new search logic
        window.beltItems[2] = { name: c.fabric, quantity: 5 };
        window.beltItems[3] = { name: c.oil, quantity: 5 };

        window.selectedSlotIndex = 1; // Slot 2
        window.updateUI();
    }, constants);

    // 2. Verify fuel consumption while held
    await page.waitForTimeout(2000);
    const fuelAfterHolding = await page.evaluate(() => {
        return window.beltItems[window.selectedSlotIndex].fuel;
    });
    console.log('Fuel after holding:', fuelAfterHolding);
    expect(fuelAfterHolding).toBeLessThan(50);

    // 3. Place torch and verify body fuel
    await page.evaluate(() => {
        const item = window.beltItems[1];
        const pos = new window.THREE.Vector3(2, 1, 2);
        const quat = new window.THREE.Quaternion();
        const block = window.createPlaceableBlock(pos, quat, 'tocha');
        block.userData.fuel = item.fuel;
        block.userData.isOn = item.isOn;
        // Mock removing from inventory
        window.beltItems[1] = null;
        window.updateUI();
    });

    const bodyFuel = await page.evaluate(() => {
        const torchBody = window.activeCampfires.find(cf => cf.userData.type === 'tocha');
        return torchBody.userData.fuel;
    });
    console.log('Body fuel:', bodyFuel);
    expect(bodyFuel).toBeLessThanOrEqual(fuelAfterHolding);
    expect(bodyFuel).toBeGreaterThan(fuelAfterHolding - 0.5);

    // 4. Refuel via menu
    await page.evaluate(() => {
        const torchBody = window.activeCampfires.find(cf => cf.userData.type === 'tocha');
        window.openFuelMenu(torchBody);
    });

    await page.evaluate(() => window.addFuel());

    const bodyFuelAfterRefuel = await page.evaluate(() => {
        return window.currentFuelBody.userData.fuel;
    });
    console.log('Body fuel after refuel:', bodyFuelAfterRefuel);
    expect(bodyFuelAfterRefuel).toBeGreaterThan(bodyFuel);

    // 5. Take back to belt (Using "Utilizar" button)
    await page.click('#useTorchButton');

    const beltItemFuel = await page.evaluate((c) => {
        const item = window.beltItems.find(it => it && it.name === c.torch);
        return item ? item.fuel : null;
    }, constants);
    console.log('Belt item fuel:', beltItemFuel);
    expect(beltItemFuel).toBeLessThanOrEqual(bodyFuelAfterRefuel);
    expect(beltItemFuel).toBeGreaterThan(bodyFuelAfterRefuel - 0.5);
});
