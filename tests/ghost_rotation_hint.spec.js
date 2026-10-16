const { test, expect } = require('@playwright/test');

test.describe('Ghost Block Rotation and Interaction Hint', () => {
    test('Verify interaction hint and rotation for placeable item and seed', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('http://localhost:8080/index.htm');
        await page.evaluate(() => localStorage.clear());

        await page.waitForFunction(() => typeof window.executeFinalGameLaunch === 'function', { timeout: 60000 });
        await page.evaluate(() => window.executeFinalGameLaunch());
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

        // Focus game canvas and simulate looking down
        await page.evaluate(() => {
            window.camera.lookAt(0, -10, 0);
            window.beltItems[0] = { name: 'cob', quantity: 10 };
            window.selectedSlotIndex = 0;
            window.updateUI();
            window.animate();
        });

        await page.waitForTimeout(200);

        const cobHintText = await page.evaluate(() => {
            const el = document.getElementById('interactionHint');
            return el ? el.textContent : '';
        });

        expect(cobHintText).toBe('(Botão Esq.) Colocar / (T) Girar');

        // Check initial rotation
        const initialRotation = await page.evaluate(() => window.ghostBlockRotationY);
        expect(initialRotation).toBe(0);

        // Trigger keydown 't'
        await page.evaluate(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
        });
        await page.waitForTimeout(100);

        const rotatedOnce = await page.evaluate(() => window.ghostBlockRotationY);
        expect(rotatedOnce).toBeCloseTo(Math.PI / 4, 4);

        // Trigger keydown 't' again
        await page.evaluate(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
        });
        await page.waitForTimeout(100);

        const rotatedTwice = await page.evaluate(() => window.ghostBlockRotationY);
        expect(rotatedTwice).toBeCloseTo(Math.PI / 2, 4);

        // Now place apple seed ('semente_macieira') in slot 0
        await page.evaluate(() => {
            window.beltItems[0] = { name: window.appleSeedItemName, quantity: 5 };
            window.selectedSlotIndex = 0;
            window.updateUI();
            window.animate();
        });

        await page.waitForTimeout(200);

        const seedHintText = await page.evaluate(() => {
            const el = document.getElementById('interactionHint');
            return el ? el.textContent : '';
        });

        // Apple seed should NOT have (T) Girar option
        expect(seedHintText).toBe('(Botão Esq.) Plantar');
    });
});
