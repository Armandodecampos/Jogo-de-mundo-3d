import { test, expect } from '@playwright/test';

test('campfire can be crafted with three branches and no grass', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

    await page.evaluate(() => {
        window.addItemToInventory(window.backpackItems, { name: 'galho', quantity: 3 });
        window.updateCraftingDisplay('initial');
    });

    const campfireRecipe = page.locator('.recipe-item').filter({
        has: page.locator('.recipe-name', { hasText: /^1 Fogueira$/ })
    });
    await expect(campfireRecipe).toHaveClass(/can-craft/);
    await expect(campfireRecipe.locator('.craft-button')).toBeEnabled();
});

test('craftable recipes appear first and ingredient colors reflect inventory', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

    const result = await page.evaluate(() => {
        window.beltItems.fill(null);
        window.backpackItems.fill(null);
        window.addItemToInventory(window.backpackItems, { name: 'galho', quantity: 3 }, Infinity, true);
        window.addItemToInventory(window.backpackItems, { name: 'capim', quantity: 1 }, Infinity, true);
        window.updateCraftingDisplay('initial');

        const cards = [...document.querySelectorAll('#recipesContainer .recipe-item')];
        const firstUnavailableIndex = cards.findIndex(card => !card.classList.contains('can-craft'));
        const firstCraftableIndex = cards.findIndex(card => card.classList.contains('can-craft'));
        const torch = cards.find(card => card.querySelector('.recipe-name').textContent === '1 Tocha');
        return {
            craftableRecipesComeFirst: firstUnavailableIndex === -1 ||
                (firstCraftableIndex !== -1 && firstCraftableIndex < firstUnavailableIndex),
            torchIngredients: [...torch.querySelectorAll('.recipe-ingredients span')].map(span => ({
                text: span.textContent,
                color: window.getComputedStyle(span).color
            }))
        };
    });

    expect(result.craftableRecipesComeFirst).toBe(true);
    expect(result.torchIngredients).toEqual([
        { text: '1 Galho', color: 'rgb(27, 94, 32)' },
        { text: '1 Tecido', color: 'rgb(198, 40, 40)' },
        { text: '1 Óleo Vegetal', color: 'rgb(198, 40, 40)' }
    ]);
});

test('torch recipes accept oil in a clay pot or glass pot', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

    const torchRecipes = await page.evaluate(() => {
        return window.recipes.initial
            .filter(({ result }) => result.name === 'tocha')
            .map(recipe => recipe.ingredients);
    });

    expect(torchRecipes).toEqual([
        [
            { name: 'galho', quantity: 1 },
            { name: 'tecido', quantity: 1 },
            { name: 'oleo_pote_barro', quantity: 1 }
        ],
        [
            { name: 'galho', quantity: 1 },
            { name: 'tecido', quantity: 1 },
            { name: 'oleo_pote_vidro', quantity: 1 }
        ]
    ]);
});

test('grass basket recipe requires only five grass', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

    const basketIngredients = await page.evaluate(() => {
        const recipe = window.recipes.initial.find(({ result }) => result.name === 'cesto_capim');
        return recipe.ingredients;
    });

    expect(basketIngredients).toEqual([{ name: 'capim', quantity: 5 }]);
});

test('wooden bed and sleeping mat recipes use the requested ingredients', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/index.htm');
    await page.click('#startButton');
    await page.waitForFunction(() => window.isWorldReady === true, { timeout: 120000 });

    const recipes = await page.evaluate(() => ({
        bed: window.recipes.workbench.find(({ result }) => result.name === window.bedItemName).ingredients,
        mat: window.recipes.initial.find(({ result }) => result.name === window.sleepingMatItemName).ingredients
    }));

    expect(recipes.bed).toEqual([
        { name: 'bloco_madeira', quantity: 10 },
        { name: 'tecido', quantity: 5 },
        { name: 'capim', quantity: 30 },
        { name: 'corda', quantity: 2 }
    ]);
    expect(recipes.mat).toEqual([
        { name: 'tecido', quantity: 5 },
        { name: 'capim', quantity: 30 },
        { name: 'corda', quantity: 2 }
    ]);
});

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
