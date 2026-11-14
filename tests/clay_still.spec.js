const { test, expect } = require('@playwright/test');

test.describe('Clay still and water jars', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
    });

    test('furnace crafts the still and empty jar; still purifies salt water', async ({ page }) => {
        const result = await page.evaluate(() => {
            const addItem = (name, quantity) =>
                window.addItemToInventory(window.backpackItems, { name, quantity }, Infinity, true);
            addItem('terra', 2);
            window.openedFurnace = { userData: { isOn: true } };
            window.openCraftingMenu('furnace');

            const craftRecipe = name => {
                const recipe = [...document.querySelectorAll('#recipesContainer .recipe-item')]
                    .find(element => element.querySelector('.recipe-name').textContent.includes(name));
                recipe.querySelector('.craft-button').click();
            };
            craftRecipe('Alambique de Barro');
            craftRecipe('Jarra vazia');
            const furnaceItems = window.backpackItems.filter(Boolean).map(item => item.name);
            window.closeCraftingMenu();

            addItem('balde_agua_salgada', 1);
            window.openCraftingMenu('distiller');
            const distillerRecipe = document.querySelector('#recipesContainer .recipe-item');
            const recipeIngredients = distillerRecipe.querySelector('.recipe-ingredients').textContent;
            distillerRecipe.querySelector('.craft-button').click();

            const filledJar = window.backpackItems.find(item => item && item.name === window.waterJarItemName);
            return {
                furnaceItems,
                recipeIngredients,
                stillRecipe: window.recipes.furnace.find(recipe =>
                    recipe.result.name === window.clayStillItemName
                ).ingredients,
                emptyJarRecipe: window.recipes.furnace.find(recipe =>
                    recipe.result.name === window.emptyJarItemName
                ).ingredients,
                saltBucketConsumed: !window.backpackItems.some(item => item && item.name === 'balde_agua_salgada'),
                filledJar: filledJar && {
                    quantity: filledJar.quantity,
                    fill: filledJar.waterFillProgress
                }
            };
        });

        expect(result.furnaceItems).toContain('alambique_barro');
        expect(result.furnaceItems).toContain('jarra_vazia');
        expect(result.stillRecipe).toEqual([{ name: 'terra', quantity: 1 }]);
        expect(result.emptyJarRecipe).toEqual([{ name: 'terra', quantity: 1 }]);
        expect(result.recipeIngredients).toContain('1 Balde de água salgada');
        expect(result.recipeIngredients).toContain('1 Jarra vazia');
        expect(result.saltBucketConsumed).toBe(true);
        expect(result.filledJar).toEqual({ quantity: 1, fill: 1 });
    });

    test('still support is restricted to campfire tops and clicking it opens crafting', async ({ page }) => {
        const result = await page.evaluate(() => {
            Object.defineProperty(document, 'pointerLockElement', {
                get: () => window.renderer.domElement,
                configurable: true
            });
            const campfirePosition = new THREE.Vector3(10, window.getSurfaceHeight(10, 10) + 0.25, 10);
            const campfire = window.createPlaceableBlock(campfirePosition, null, 'fogueira');
            const topNormal = new THREE.Vector3(0, 1, 0);
            const sideNormal = new THREE.Vector3(1, 0, 0);
            const onCampfireTop = window.canPlaceClayStillOnCampfire(campfire, topNormal);
            const onCampfireSide = window.canPlaceClayStillOnCampfire(campfire, sideNormal);
            const stillPosition = campfirePosition.clone().add(new THREE.Vector3(0, 0.475, 0));
            const still = window.createPlaceableBlock(stillPosition, null, window.clayStillItemName);
            const stillMesh = window.scene.children.find(child => child.userData.physicsBody === still);
            window.raycaster.intersectObjects = () => [{ distance: 1, object: stillMesh }];
            const opened = window.interact();
            return {
                onCampfireTop,
                onCampfireSide,
                onOtherSurface: window.canPlaceClayStillOnCampfire(still, topNormal),
                duplicateRejected: !window.canPlaceClayStillOnCampfire(campfire, topNormal),
                opened,
                title: document.getElementById('craftingTitle').textContent
            };
        });

        expect(result.onCampfireTop).toBe(true);
        expect(result.onCampfireSide).toBe(false);
        expect(result.onOtherSurface).toBe(false);
        expect(result.duplicateRejected).toBe(true);
        expect(result.opened).toBe(true);
        expect(result.title).toBe('Alambique de Barro');
    });

    test('water jar gives four sips and retains its water amount in a save', async ({ page }) => {
        const result = await page.evaluate(() => {
            Object.defineProperty(document, 'pointerLockElement', {
                get: () => window.renderer.domElement,
                configurable: true
            });
            window.thirstDecayRate = 0;
            window.playerThirst = 0;

            window.createJar(new THREE.Vector3(10, 1, 10), null, {
                name: window.waterJarItemName,
                quantity: 1,
                waterFillProgress: 1
            });
            let jar = window.collectibleBoxes.find(({ body }) =>
                body.userData.type === window.waterJarItemName
            ).body;
            let targetMesh = window.collectibleBoxes.find(({ body }) => body === jar).mesh;
            window.raycaster.intersectObjects = () => [{ distance: 1, object: targetMesh }];

            window.interact();
            const saved = window.getGameStateData();
            window.loadGameState(saved);
            jar = window.collectibleBoxes.find(({ body }) =>
                body.userData.type === window.waterJarItemName
            ).body;
            targetMesh = window.collectibleBoxes.find(({ body }) => body === jar).mesh;
            const savedFill = jar.userData.waterFillProgress;

            for (let sip = 0; sip < 3; sip++) window.interact();

            return {
                savedGroundFill: saved.groundItems.find(item =>
                    item.type === window.waterJarItemName
                ).userData.waterFillProgress,
                savedFill,
                thirst: window.playerThirst,
                remainingType: jar.userData.type,
                remainingWater: jar.userData.waterFillProgress,
                visibleWater: jar.userData.waterMesh.visible
            };
        });

        expect(result.savedGroundFill).toBe(0.75);
        expect(result.savedFill).toBe(0.75);
        expect(result.thirst).toBe(100);
        expect(result.remainingType).toBe('jarra_vazia');
        expect(result.remainingWater).toBe(0);
        expect(result.visibleWater).toBe(false);
    });
});
