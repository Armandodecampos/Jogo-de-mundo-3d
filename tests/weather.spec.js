const { test, expect } = require('@playwright/test');

test.describe('Weather System', () => {
    test.beforeEach(async ({ page }) => {
        // Aumenta o timeout para o carregamento inicial
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        // Espera o mundo estar pronto
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
        // Despausa o jogo para que os updates ocorram
        await page.evaluate(() => { window.gamePaused = false; });
    });

    test('sparse clouds are removed when rain starts', async ({ page }) => {
        // Garante que há nuvens esparsas
        await page.evaluate(() => {
            // Remove nuvens existentes primeiro para controle do teste
            window.clouds.forEach(c => {
                window.scene.remove(c.mesh);
                c.mesh.children.forEach(child => { if (child.geometry) child.geometry.dispose(); });
            });
            window.clouds.length = 0;

            // Prepara estado inicial de clima limpo
            window.targetRainIntensity = 0;

            // Cria nuvens fixas
            for (let i = 0; i < 5; i++) {
                window.spawnCloud(true);
            }
        });

        const initialCloudCount = await page.evaluate(() => window.clouds.length);
        expect(initialCloudCount).toBeGreaterThan(0);

        // Dispara a transição para chuva
        await page.evaluate(() => {
            window.targetRainIntensity = 1.0;
            window.updateWeather(0.016);
        });

        // Verifica se limpou
        const cloudCountAfterRain = await page.evaluate(() => window.clouds.length);
        expect(cloudCountAfterRain).toBe(0);
    });

    test('sky darkens with rain intensity', async ({ page }) => {
        // Pega a cor inicial do céu (meio-dia)
        const initialColor = await page.evaluate(() => {
            const c = window.scene.background;
            return { r: c.r, g: c.g, b: c.b };
        });

        // Define intensidade de chuva máxima e coloca o jogador embaixo da nuvem
        await page.evaluate(() => {
            window.targetRainIntensity = 1.0;
            window.rainIntensity = 1.0; // Força para teste imediato

            // Força a nuvem a estar sobre o jogador para que localRainIntensity seja > 0
            if (window.rainCloud) {
                window.rainCloud.active = true;
                window.rainCloud.position.copy(window.camera.position);
                window.rainCloud.radius = 500;
            }
        });

        // Espera um frame
        await page.waitForTimeout(500);

        const finalColor = await page.evaluate(() => {
            const c = window.scene.background;
            return { r: c.r, g: c.g, b: c.b };
        });

        // Deve estar mais escuro que a cor inicial
        expect(finalColor.r).toBeLessThan(initialColor.r);
        expect(finalColor.g).toBeLessThan(initialColor.g);
        expect(finalColor.b).toBeLessThan(initialColor.b);
    });

    test('weather toggle button works', async ({ page }) => {
        // Força o menu de configurações a aparecer
        await page.evaluate(() => {
            document.getElementById('settingsScreen').classList.add('active');
        });

        // Verifica texto inicial
        const initialStatus = await page.textContent('#weatherStatus');
        expect(initialStatus).toBe('Limpo');

        // Clica no botão de alternar via evaluate para evitar interceptação
        await page.evaluate(() => {
            document.getElementById('weatherToggle').click();
        });

        // Verifica se mudou o texto e o targetRainIntensity
        const finalStatus = await page.textContent('#weatherStatus');
        expect(finalStatus).toBe('Chuva');

        const targetRain = await page.evaluate(() => window.targetRainIntensity);
        expect(targetRain).toBeGreaterThan(0);
    });
});
