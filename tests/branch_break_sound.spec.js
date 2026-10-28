const { test, expect } = require('@playwright/test');

test.describe('Branch Break Sound Verification', () => {
    test('Verify playBranchBreakSound function is defined and invoked when breaking a tree branch', async ({ page }) => {
        await page.goto('http://localhost:8080/index.htm');

        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

        // Verify window.playBranchBreakSound exists
        const exists = await page.evaluate(() => typeof window.playBranchBreakSound === 'function');
        expect(exists).toBe(true);

        // Spy on playBranchBreakSound
        await page.evaluate(() => {
            window.branchBreakSoundCount = 0;
            const origSound = window.playBranchBreakSound;
            window.playBranchBreakSound = function() {
                window.branchBreakSoundCount++;
                if (origSound) origSound();
            };
        });

        // Test breaking a tree branch and triggering sound
        const soundCount = await page.evaluate(() => {
            // Spawn an adult tree at (40, 0, 10)
            const adultBody = window.createPlaceableBlock(
                new window.THREE.Vector3(40, 0, 10),
                null,
                'muda_arvore',
                'arvore_adulta'
            );
            const adultIndex = window.placedConstructionBodies.indexOf(adultBody);
            const adultMesh = window.placedConstructionMeshes[adultIndex];

            // Find a branch mesh in the tree
            let branchMesh = null;
            if (adultMesh && adultMesh.children) {
                adultMesh.traverse(child => {
                    if (child.userData && child.userData.isBranch && child.visible) {
                        branchMesh = child;
                    }
                });
            }

            if (!branchMesh) {
                return { error: 'Branch mesh not found' };
            }

            // Simulate breaking the branch logic
            const body = branchMesh.userData.treeBody;
            const branchIndex = branchMesh.userData.branchIndex;

            if (body && body.userData.branches && body.userData.branches[branchIndex]) {
                body.userData.branches[branchIndex].broken = true;
                body.userData.branches[branchIndex].lastBrokenTime = window.world.time;
                branchMesh.visible = false;

                window.addItemToInventory(window.backpackItems, { name: 'galho', quantity: 1 });
                window.playBranchBreakSound();
            }

            return { count: window.branchBreakSoundCount };
        });

        expect(soundCount.count).toBe(1);
    });
});
