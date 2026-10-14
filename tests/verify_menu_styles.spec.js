import { test, expect } from '@playwright/test';

test('verify menu item quantity font and crafting available style', async ({ page }) => {
    // Navigate to index.htm
    await page.goto('file://' + process.cwd() + '/index.htm');

    // Click start button to launch game
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

    // Give player items: 3 galho and 1 capim so fogueira is craftable
    await page.evaluate(() => {
        window.addItemToInventory(window.backpackItems, { name: 'galho', quantity: 3 });
        window.addItemToInventory(window.backpackItems, { name: 'capim', quantity: 1 });
        window.updateCraftingDisplay('initial');
        document.getElementById('craftingModal').style.display = 'block';
    });

    // Open crafting modal
    const canCraftRecipe = page.locator('.recipe-item.can-craft').first();
    await expect(canCraftRecipe).toBeVisible();

    // Scroll into view
    await canCraftRecipe.scrollIntoViewIfNeeded();

    const recipeStyle = await page.evaluate(() => {
        const el = document.querySelector('.recipe-item.can-craft');
        if (!el) return null;
        const style = window.getComputedStyle(el);
        return {
            color: style.color,
            backgroundColor: style.backgroundColor
        };
    });

    console.log('Can-craft recipe style:', recipeStyle);
    expect(recipeStyle).not.toBeNull();
    expect(recipeStyle.color).toBe('rgb(0, 0, 0)');

    // Now test slot-quantity by adding galho x5 to beltItems
    await page.evaluate(() => {
        window.addItemToInventory(window.beltItems, { name: 'galho', quantity: 5 });
        window.updateBeltDisplay();
    });

    const quantityStyle = await page.evaluate(() => {
        const span = document.querySelector('.slot-quantity');
        if (!span) return null;
        const style = window.getComputedStyle(span);
        return {
            color: style.color,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight
        };
    });

    console.log('Slot quantity style:', quantityStyle);
    expect(quantityStyle).not.toBeNull();
    // rgb(0, 0, 0) is black
    expect(quantityStyle.color).toBe('rgb(0, 0, 0)');

    // Take screenshot of crafting modal
    await page.screenshot({ path: 'verify_menu_styles.png' });
});
