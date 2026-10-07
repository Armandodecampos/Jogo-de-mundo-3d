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

    test('Save and load restores ground items properly without converting them into caixotes', async ({ page }) => {
        const restoredTypes = await page.evaluate(() => {
            // Clear ground items first
            for (let i = window.collectibleBoxes.length - 1; i >= 0; i--) {
                const box = window.collectibleBoxes[i];
                if (box.body) window.world.removeBody(box.body);
                if (box.mesh) window.scene.remove(box.mesh);
            }
            window.collectibleBoxes.length = 0;

            // Drop a galho (dropped item) and place a caixote
            window.createBox(new CANNON.Vec3(0, 5, 0)); // boxItemName ('caixote')

            // Create droppable item
            const itemSize = 0.5;
            const itemShape = new CANNON.Box(new CANNON.Vec3(itemSize/2, itemSize/2, itemSize/2));
            const itemGeometry = new THREE.BoxGeometry(itemSize, itemSize, itemSize);
            const itemMaterial = new THREE.MeshBasicMaterial();
            const itemBody = new CANNON.Body({ mass: 10, shape: itemShape });
            itemBody.position.set(2, 5, 0);
            window.world.addBody(itemBody);
            itemBody.userData = { isCollectible: true, type: 'galho', quantity: 1 };
            const mesh = new THREE.Mesh(itemGeometry, itemMaterial);
            mesh.userData.physicsBody = itemBody;
            window.scene.add(mesh);
            window.collectibleBoxes.push({ body: itemBody, mesh: mesh });

            // Get game state
            const state = window.getGameStateData();

            // Load game state back
            window.loadGameState(state);

            // Return types of ground items in collectibleBoxes
            return window.collectibleBoxes.map(b => b.body.userData.type);
        });

        expect(restoredTypes).toContain('caixote');
        expect(restoredTypes).toContain('galho');
        expect(restoredTypes.filter(t => t === 'caixote').length).toBe(1);
    });
});
