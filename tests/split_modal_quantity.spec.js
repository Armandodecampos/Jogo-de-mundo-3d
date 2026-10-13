const { test, expect } = require('@playwright/test');

test.describe('Split Modal Quantity Selection', () => {
    test('Verify custom increase/decrease buttons, Mínimo, and Máximo functionality in splitModal', async ({ page }) => {
        test.setTimeout(90000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');

        // Wait for world to be ready
        await page.waitForFunction(() => window.isWorldReady === true);

        // Setup container with 10 stone items and open split modal
        await page.evaluate(() => {
            const pos = new window.THREE.Vector3(0, window.getSurfaceHeight(0, -2) + 0.5, -2);
            const quat = new window.THREE.Quaternion();
            const chest = window.createBox(pos, quat);
            window.addItemToInventory(chest.userData.inventory, { name: 'pedra', quantity: 10 }, chest.userData.maxWeight, true);
            window.openChest(chest);

            // Click slot 0 in chest containing stack of 10
            const slotDiv = document.querySelector('#chestSlotsContainer .slot');
            if (slotDiv) {
                slotDiv.click();
            }
        });

        const splitInput = page.locator('#splitInput');
        await expect(splitInput).toHaveValue('1');

        // 1. Increase button (+1)
        await page.click('#splitIncreaseBtn', { force: true });
        await expect(splitInput).toHaveValue('2');

        // 2. Increase button (+1 again)
        await page.click('#splitIncreaseBtn', { force: true });
        await expect(splitInput).toHaveValue('3');

        // 3. Decrease button (-1)
        await page.click('#splitDecreaseBtn', { force: true });
        await expect(splitInput).toHaveValue('2');

        // 4. Max button
        await page.click('#splitMaxBtn', { force: true });
        await expect(splitInput).toHaveValue('10');

        // 5. Increase at max boundary
        await page.click('#splitIncreaseBtn', { force: true });
        await expect(splitInput).toHaveValue('10');

        // 6. Min button
        await page.click('#splitMinBtn', { force: true });
        await expect(splitInput).toHaveValue('1');

        // 7. Decrease at min boundary
        await page.click('#splitDecreaseBtn', { force: true });
        await expect(splitInput).toHaveValue('1');

        // 8. Visual inspection screenshot of the custom split modal
        await page.screenshot({ path: 'split_modal_screenshot.png' });

        // 9. Confirm split and check item quantity
        const splitModal = page.locator('#splitModal');
        await page.click('#confirmSplit', { force: true });
        await expect(splitModal).toBeHidden();

        const selectedQty = await page.evaluate(() => {
            return window.selectedItem ? window.selectedItem.item.quantity : null;
        });

        expect(selectedQty).toBe(1);
    });
});
