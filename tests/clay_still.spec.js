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
            addItem('galho', 3);
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

            const still = window.createPlaceableBlock(
                new THREE.Vector3(10, window.getSurfaceHeight(10, 10) + 0.45, 10),
                null,
                window.clayStillItemName,
                null,
                { fuel: 50, isOn: true }
            );
            addItem('balde_agua_salgada', 1);
            window.openFuelMenu(still);
            document.getElementById('accessFurnaceButton').click();

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
        expect(result.stillRecipe).toEqual([
            { name: 'terra', quantity: 1 },
            { name: 'galho', quantity: 3 }
        ]);
        expect(result.emptyJarRecipe).toEqual([{ name: 'terra', quantity: 1 }]);
        expect(result.recipeIngredients).toContain('1 Balde de água salgada');
        expect(result.recipeIngredients).toContain('1 Jarra vazia');
        expect(result.saltBucketConsumed).toBe(true);
        expect(result.filledJar).toEqual({ quantity: 1, fill: 1 });
    });

    test('still can be placed alone and needs fuel before opening its crafting menu', async ({ page }) => {
        const result = await page.evaluate(() => {
            Object.defineProperty(document, 'pointerLockElement', {
                get: () => window.renderer.domElement,
                configurable: true
            });
            const stillPosition = new THREE.Vector3(10, window.getSurfaceHeight(10, 10) + 0.45, 10);
            const still = window.createPlaceableBlock(stillPosition, null, window.clayStillItemName);
            const fireGroup = still.userData.fireGroup;
            const stillMesh = window.scene.children.find(child => child.userData.physicsBody === still);
            stillMesh.updateMatrixWorld(true);
            const firewoodMeshes = stillMesh.children.filter(child => child.userData.isStillFirewood);
            const vesselMesh = stillMesh.children.find(child => child.userData.isStillVessel);
            const firewoodBounds = new THREE.Box3();
            firewoodMeshes.forEach(log => firewoodBounds.expandByObject(log));
            const vesselBounds = new THREE.Box3().setFromObject(vesselMesh);
            window.raycaster.intersectObjects = () => [{ distance: 1, object: stillMesh }];
            const opened = window.interact();
            const placedAlone = window.placedConstructionBodies.includes(still);
            const fuelMenuTitle = document.getElementById('fuelTitle').textContent;
            const accessText = document.getElementById('accessFurnaceButton').textContent;
            window.addItemToInventory(window.backpackItems, { name: 'galho', quantity: 1 }, Infinity, true);
            document.getElementById('addFuelButton').click();
            const refueled = still.userData.fuel;
            document.getElementById('toggleFireButton').click();
            const fireIsOn = still.userData.isOn;
            document.getElementById('accessFurnaceButton').click();
            const stillRegisteredForFuel = window.activeCampfires.includes(still);
            const saved = window.getGameStateData();
            window.closeCraftingMenu();
            window.loadGameState(saved);
            const restoredStill = window.placedConstructionBodies.find(body =>
                body.userData.type === window.clayStillItemName
            );
            return {
                placedAlone,
                hasBuiltInFire: Boolean(still.userData.fireGroup && still.userData.fireLight),
                fireBaseAtGround: fireGroup.position.y + still.userData.dimensions.height / 2,
                firewoodCount: firewoodMeshes.length,
                firewoodGroundGap: firewoodBounds.min.y - (still.position.y - still.userData.dimensions.height / 2),
                vesselToFirewoodGap: vesselBounds.min.y - firewoodBounds.max.y,
                opened,
                fuelMenuTitle,
                accessText,
                refueled,
                fireIsOn,
                craftingTitle: document.getElementById('craftingTitle').textContent,
                stillRegisteredForFuel,
                restoredFuel: restoredStill.userData.fuel,
                restoredFireIsOn: restoredStill.userData.isOn,
                restoredHasFire: Boolean(restoredStill.userData.fireGroup)
            };
        });

        expect(result.placedAlone).toBe(true);
        expect(result.hasBuiltInFire).toBe(true);
        expect(result.fireBaseAtGround).toBeCloseTo(0);
        expect(result.firewoodCount).toBe(3);
        expect(result.firewoodGroundGap).toBeCloseTo(0);
        expect(result.vesselToFirewoodGap).toBeCloseTo(0);
        expect(result.opened).toBe(true);
        expect(result.fuelMenuTitle).toBe('Alambique de Barro');
        expect(result.accessText).toBe('Usar Alambique');
        expect(result.refueled).toBe(20);
        expect(result.fireIsOn).toBe(true);
        expect(result.craftingTitle).toBe('Alambique de Barro');
        expect(result.stillRegisteredForFuel).toBe(true);
        expect(result.restoredFuel).toBe(20);
        expect(result.restoredFireIsOn).toBe(true);
        expect(result.restoredHasFire).toBe(true);
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
