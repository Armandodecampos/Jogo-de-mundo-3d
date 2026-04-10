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
            window.lastWeatherChange = window.world.time;

            // Cria nuvens fixas perto do jogador para evitar despawn por distância
            for (let i = 0; i < 10; i++) {
                window.spawnCloud(true);
                const cloud = window.clouds[i];
                cloud.mesh.position.set(window.camera.position.x, 100, window.camera.position.z);
            }
        });

        const initialCloudCount = await page.evaluate(() => window.clouds.length);
        expect(initialCloudCount).toBe(10);

        // Dispara a transição para chuva manualmente chamando updateWeather com condições forçadas
        await page.evaluate(() => {
            // Forçamos a mudança de ciclo fazendo o tempo parecer ter passado muito
            // No nosso teste, world.time é gerido pelo loop interno.
            // Para garantir que o bloco 'if (world.time - lastWeatherChange > nextWeatherDuration)' entre:
            window.lastWeatherChange = -100000;

            // Mock de Math.random para garantir a entrada no bloco de transição para chuva
            const oldRandom = Math.random;
            Math.random = () => 0.05; // Menor que 0.125

            // Chama o updateWeather uma vez para disparar a lógica de transição
            window.updateWeather(0.016);

            Math.random = oldRandom;
        });

        // Verifica se limpou
        const cloudCountAfterRain = await page.evaluate(() => window.clouds.length);
        expect(cloudCountAfterRain).toBe(0);

        // Verifica se targetRainIntensity subiu
        const targetRain = await page.evaluate(() => window.targetRainIntensity);
        expect(targetRain).toBeGreaterThan(0);
    });

    test('global cloud layer opacity increases with rain intensity', async ({ page }) => {
        // Inicialmente opacidade deve ser 0
        const initialOpacity = await page.evaluate(() => window.globalCloudMesh.material.opacity);
        expect(initialOpacity).toBe(0);

        // Define intensidade de chuva
        await page.evaluate(() => {
            window.targetRainIntensity = 1.0;
            // Força rainIntensity a subir rápido para o teste
            // (Normalmente leva tempo via interpolação no updateWeather)
        });

        // Espera a interpolação ou força o valor
        await page.evaluate(() => {
            window.rainIntensity = 1.0;
        });

        // Espera um frame para updateClouds processar
        await page.waitForTimeout(100);

        const finalOpacity = await page.evaluate(() => window.globalCloudMesh.material.opacity);
        expect(finalOpacity).toBeGreaterThan(0.9);

        const color = await page.evaluate(() => {
            const c = window.globalCloudMesh.material.color;
            return { r: c.r, g: c.g, b: c.b };
        });
        // Deve estar escuro (preto se rainIntensity=1)
        expect(color.r).toBeLessThan(0.1);
    });

    test('sparse clouds fade in when spawned', async ({ page }) => {
        // Para garantir que não comece a chover e remova as nuvens
        await page.evaluate(() => {
            window.targetRainIntensity = 0;
            window.rainIntensity = 0;
            // Remove nuvens existentes
            window.clouds.forEach(c => window.scene.remove(c.mesh));
            window.clouds.length = 0;
        });

        // Pequeno delay para garantir que o frame de remoção passou se houvesse algum
        await page.waitForTimeout(100);

        await page.evaluate(() => window.spawnCloud(true));

        const initialOpacity = await page.evaluate(() => window.clouds[0].material.opacity);
        // O valor pode já ter incrementado um pouco se o frame rodou imediatamente
        expect(initialOpacity).toBeLessThan(0.1);

        // Espera alguns frames para o fade-in
        await page.waitForTimeout(500);

        const opacityAfterSomeTime = await page.evaluate(() => window.clouds[0].material.opacity);
        expect(opacityAfterSomeTime).toBeGreaterThan(initialOpacity);
    });
});
