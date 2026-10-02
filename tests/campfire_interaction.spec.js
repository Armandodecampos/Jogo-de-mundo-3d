const { test, expect } = require('@playwright/test');

test('Campfire interaction hint, fuel menu, and refueling with Lenha', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Place a campfire in front of the player
    const campfireBody = await page.evaluate(() => {
        const pos = new window.THREE.Vector3(0, window.getSurfaceHeight(0, -2) + 0.25, -2);
        const quat = new window.THREE.Quaternion();
        const cf = window.createPlaceableBlock(pos, quat, 'fogueira');
        return cf ? cf.userData.type : null;
    });

    expect(campfireBody).toBe('fogueira');

    // Test openFuelMenu for campfire
    const fuelMenuDetails = await page.evaluate(() => {
        const cfBody = window.activeCampfires.find(cf => cf.userData.type === 'fogueira');
        if (!cfBody) return null;
        window.openFuelMenu(cfBody);
        const title = document.getElementById('fuelTitle').textContent;
        const addBtn = document.getElementById('addFuelButton').textContent;
        const isHidden = document.getElementById('fuelModal').classList.contains('hidden');
        return { title, addBtn, isHidden, initialFuel: cfBody.userData.fuel };
    });

    expect(fuelMenuDetails.isHidden).toBe(false);
    expect(fuelMenuDetails.title).toBe('Fogueira');
    expect(fuelMenuDetails.addBtn).toBe('Abastecer (1 Galho / 1 Lenha)');
    expect(fuelMenuDetails.initialFuel).toBe(0);

    // Give 'lenha' (firewood) to player inventory and refuel
    const updatedFuel = await page.evaluate(() => {
        const cfBody = window.activeCampfires.find(cf => cf.userData.type === 'fogueira');
        window.addItemToInventory(window.backpackItems, { name: window.firewoodItemName, quantity: 2 });
        window.addFuel();
        return cfBody.userData.fuel;
    });

    expect(updatedFuel).toBe(50);

    // Close fuel menu
    await page.evaluate(() => {
        window.closeFuelMenu();
    });
});

test('Furnace fuel menu and refueling with Lenha', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world to be ready
    await page.waitForFunction(() => window.isWorldReady === true);

    // Place a furnace in front of the player
    const furnaceBody = await page.evaluate(() => {
        const pos = new window.THREE.Vector3(0, window.getSurfaceHeight(0, -2) + 0.5, -2);
        const quat = new window.THREE.Quaternion();
        const furnace = window.createPlaceableBlock(pos, quat, 'forno');
        return furnace ? furnace.userData.type : null;
    });

    expect(furnaceBody).toBe('forno');

    // Test openFuelMenu for furnace
    const fuelMenuDetails = await page.evaluate(() => {
        const fBody = window.activeCampfires.find(cf => cf.userData.type === 'forno');
        if (!fBody) return null;
        window.openFuelMenu(fBody);
        const title = document.getElementById('fuelTitle').textContent;
        const addBtn = document.getElementById('addFuelButton').textContent;
        const accessBtnIsHidden = document.getElementById('accessFurnaceButton').classList.contains('hidden');
        return { title, addBtn, accessBtnIsHidden, initialFuel: fBody.userData.fuel };
    });

    expect(fuelMenuDetails.title).toBe('Forno');
    expect(fuelMenuDetails.addBtn).toBe('Abastecer (1 Galho / 1 Lenha)');
    expect(fuelMenuDetails.accessBtnIsHidden).toBe(false);
    expect(fuelMenuDetails.initialFuel).toBe(0);

    // Give 'lenha' (firewood) to player inventory and refuel furnace
    const updatedFuel = await page.evaluate(() => {
        const fBody = window.activeCampfires.find(cf => cf.userData.type === 'forno');
        window.addItemToInventory(window.backpackItems, { name: window.firewoodItemName, quantity: 2 });
        window.addFuel();
        return fBody.userData.fuel;
    });

    expect(updatedFuel).toBe(50);

    // Close fuel menu
    await page.evaluate(() => {
        window.closeFuelMenu();
    });
});
