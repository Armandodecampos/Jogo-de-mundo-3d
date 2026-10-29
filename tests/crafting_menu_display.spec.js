import { test, expect } from '@playwright/test';

test('verify crafting menu result quantity format and fixed furnace warning', async ({ page }) => {
    // Navigate to index.htm
    await page.goto('file://' + process.cwd() + '/index.htm');

    // Click start button to launch game
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

    // Open initial crafting menu
    await page.evaluate(() => {
        window.openCraftingMenu('initial');
    });

    // Verify recipe names start with quantity (e.g., "1 Machado de Pedra", "100 Bloco de Barro", "1 Corda")
    const initialRecipeNames = await page.locator('.recipe-name').allTextContents();
    expect(initialRecipeNames.length).toBeGreaterThan(0);
    for (const recipeName of initialRecipeNames) {
        expect(recipeName).toMatch(/^\d+\s+/);
        expect(recipeName).not.toContain('x1');
        expect(recipeName).not.toContain('x100');
    }

    // Verify specifically for 'cob' recipe in initial menu ("100 Bloco de Barro")
    const cobRecipeName = initialRecipeNames.find(name => name.includes('Bloco de Barro'));
    expect(cobRecipeName).toBe('100 Bloco de Barro');

    // Open workbench crafting menu and check 'tecido' recipe ("1 Tecido") as well as all initial recipes
    await page.evaluate(() => {
        window.openCraftingMenu('workbench');
    });

    const workbenchRecipeNames = await page.locator('.recipe-name').allTextContents();
    const fabricRecipeName = workbenchRecipeNames.find(name => name.includes('Tecido'));
    expect(fabricRecipeName).toBe('1 Tecido');

    // Verify that every recipe in 'initial' is also in 'workbench'
    const initialRecipesInWindow = await page.evaluate(() => window.recipes.initial);
    const workbenchRecipesInWindow = await page.evaluate(() => window.recipes.workbench);
    expect(workbenchRecipesInWindow.length).toBeGreaterThanOrEqual(initialRecipesInWindow.length);

    for (const initRecipe of initialRecipesInWindow) {
        const found = workbenchRecipesInWindow.some(wbRecipe =>
            wbRecipe.result.name === initRecipe.result.name &&
            wbRecipe.result.quantity === initRecipe.result.quantity
        );
        expect(found).toBe(true);
    }

    // Test Furnace Menu when unlit
    await page.evaluate(() => {
        window.openedFurnace = { userData: { isOn: false } };
        window.openCraftingMenu('furnace');
    });

    const furnaceWarning = page.locator('#furnaceWarning');
    await expect(furnaceWarning).toBeVisible();
    await expect(furnaceWarning).toHaveText('Forno Apagado - Abasteça e ligue para usar');

    // Verify #furnaceWarning is NOT inside #recipesContainer
    const isInsideRecipesContainer = await page.evaluate(() => {
        const warning = document.getElementById('furnaceWarning');
        const recipesContainer = document.getElementById('recipesContainer');
        return recipesContainer.contains(warning);
    });
    expect(isInsideRecipesContainer).toBe(false);

    // Verify #furnaceWarning is inside #craftingModal directly
    const isDirectChildOfCraftingModal = await page.evaluate(() => {
        const warning = document.getElementById('furnaceWarning');
        const craftingModal = document.getElementById('craftingModal');
        return warning.parentElement === craftingModal;
    });
    expect(isDirectChildOfCraftingModal).toBe(true);
});
