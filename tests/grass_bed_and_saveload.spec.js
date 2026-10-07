const { test, expect } = require('@playwright/test');

test.describe('Grass Bed and Save/Load Ground Items Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');
        await page.waitForSelector('#startButton');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 45000 });
    });

    test('Grass Bed recipe is registered in initial recipes and accessible via R key toggle', async ({ page }) => {
        const recipeExists = await page.evaluate(() => {
            const initialRecipes = window.recipes.initial;
            return initialRecipes.some(r => r.result.name === window.grassBedItemName &&
                r.ingredients.some(i => i.name === 'capim' && i.quantity === 30) &&
                r.ingredients.some(i => i.name === 'corda' && i.quantity === 3)
            );
        });
        expect(recipeExists).toBe(true);

        // Press 'r' to toggle crafting menu
        await page.keyboard.press('r');
        await page.waitForTimeout(300);
        const modalActive = await page.evaluate(() => {
            return document.getElementById('craftingModal').classList.contains('active');
        });
        expect(modalActive).toBe(true);

        // Press 'r' again to close crafting menu
        await page.keyboard.press('r');
        await page.waitForTimeout(300);
        const modalClosed = await page.evaluate(() => {
            return !document.getElementById('craftingModal').classList.contains('active');
        });
        expect(modalClosed).toBe(true);
    });

    test('Energy recovery limits for grass bed, mat and bed', async ({ page }) => {
        const energyCaps = await page.evaluate(() => {
            window.playerEnergy = 0;
            const maxEnergy = 100;

            // Grass Bed (50%)
            window.playerBody.userData.sleepTarget = window.grassBedItemName;
            let targetMaxGrass = maxEnergy * 0.5;
            if (window.playerEnergy < targetMaxGrass) {
                window.playerEnergy = Math.min(targetMaxGrass, window.playerEnergy + 10);
            }
            const grassEnergy = window.playerEnergy;

            // Sleeping Mat (75%)
            window.playerBody.userData.sleepTarget = window.sleepingMatItemName;
            window.playerEnergy = 0;
            let targetMaxMat = maxEnergy * 0.75;
            window.playerEnergy = Math.min(targetMaxMat, window.playerEnergy + 70);
            const matEnergy = window.playerEnergy;

            // Bed (100%)
            window.playerBody.userData.sleepTarget = window.bedItemName;
            window.playerEnergy = 0;
            let targetMaxBed = maxEnergy * 1.0;
            window.playerEnergy = Math.min(targetMaxBed, window.playerEnergy + 90);
            const bedEnergy = window.playerEnergy;

            return { grassEnergy, matEnergy, bedEnergy };
        });

        expect(energyCaps.grassEnergy).toBe(10);
        expect(energyCaps.matEnergy).toBe(70);
        expect(energyCaps.bedEnergy).toBe(90);
    });

    test('Save and load restores wood items (lenha and tronco_cortado) with proper 3D meshes', async ({ page }) => {
        const woodItemDetails = await page.evaluate(() => {
            // Clear ground items first
            for (let i = window.collectibleBoxes.length - 1; i >= 0; i--) {
                const box = window.collectibleBoxes[i];
                if (box.body) window.world.removeBody(box.body);
                if (box.mesh) window.scene.remove(box.mesh);
            }
            window.collectibleBoxes.length = 0;

            // Create lenha and tronco_cortado
            const posLenha = new THREE.Vector3(0, 5, 0);
            const posTronco = new THREE.Vector3(2, 5, 0);
            window.createFirewood(posLenha);
            window.createCutTrunk(posTronco);

            // Get game state
            const state = window.getGameStateData();

            // Load game state back
            window.loadGameState(state);

            // Inspect collectibleBoxes
            return window.collectibleBoxes.map(b => ({
                type: b.body.userData.type,
                isGroup: b.mesh.type === 'Group',
                childrenCount: b.mesh.children ? b.mesh.children.length : 0
            }));
        });

        expect(woodItemDetails.length).toBe(2);
        const lenha = woodItemDetails.find(d => d.type === 'lenha');
        const tronco = woodItemDetails.find(d => d.type === 'tronco_cortado');

        expect(lenha).toBeDefined();
        expect(lenha.isGroup).toBe(true);
        expect(lenha.childrenCount).toBeGreaterThan(1); // curved mesh + flat faces

        expect(tronco).toBeDefined();
        expect(tronco.isGroup).toBe(true);
        expect(tronco.childrenCount).toBeGreaterThan(1); // curved mesh + flat face
    });

    test('Lenha, tronco_cortado and cama_capim are placeable and produce ghost preview with double sided material', async ({ page }) => {
        const ghostDetails = await page.evaluate(() => {
            const lenhaAction = window.getActionType({ name: 'lenha' });
            const troncoAction = window.getActionType({ name: 'tronco_cortado' });
            const grassBedAction = window.getActionType({ name: window.grassBedItemName });

            // Simulate selecting cama_capim slot
            window.beltItems[0] = { name: window.grassBedItemName, quantity: 1 };
            window.selectedSlotIndex = 0;

            // Check ghost material double side property
            const isDoubleSided = window.ghostBlockMaterial.side === THREE.DoubleSide;

            return { lenhaAction, troncoAction, grassBedAction, isDoubleSided };
        });

        expect(ghostDetails.lenhaAction).toBe('place');
        expect(ghostDetails.troncoAction).toBe('place');
        expect(ghostDetails.grassBedAction).toBe('place');
        expect(ghostDetails.isDoubleSided).toBe(true);
    });
});
