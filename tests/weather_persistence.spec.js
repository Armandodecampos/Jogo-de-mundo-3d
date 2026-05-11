const { test, expect } = require('@playwright/test');

test.describe('Weather Persistence', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('http://localhost:8080/index.htm');
        await page.click('#startButton');
        await page.waitForFunction(() => window.isWorldReady === true, { timeout: 90000 });
        await page.evaluate(() => { window.gamePaused = false; });
    });

    test('targetRainIntensity remains constant during a rain cycle', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.startRainCycle();
            const initialTargetIntensity = window.targetRainIntensity;
            let stayedConstant = true;

            // Simula 100 frames
            for (let i = 0; i < 100; i++) {
                window.updateWeather(0.016);
                if (window.targetRainIntensity !== initialTargetIntensity) {
                    stayedConstant = false;
                    break;
                }
            }
            return { initialTargetIntensity, stayedConstant };
        });

        expect(result.initialTargetIntensity).toBeGreaterThan(0);
        expect(result.stayedConstant).toBe(true);
    });

    test('targetRainIntensity does not change when world.time advances if it is not yet time to change', async ({ page }) => {
        const result = await page.evaluate(() => {
            window.startRainCycle();
            // Sincroniza world.time e lastWeatherChange
            window.world.time = 1000;
            window.lastWeatherChange = 1000;
            // Define uma duração longa para o ciclo de chuva para não mudar durante o teste
            window.nextWeatherDuration = 200;

            const initialTargetIntensity = window.targetRainIntensity;
            let stayedConstant = true;

            // Simula 50s de tempo de jogo (abaixo dos 200s definidos)
            for (let i = 0; i < 500; i++) {
                window.world.time += 0.1;
                window.updateWeather(0.016);
                if (window.targetRainIntensity !== initialTargetIntensity) {
                    stayedConstant = false;
                    break;
                }
            }
            return { initialTargetIntensity, stayedConstant };
        });

        expect(result.initialTargetIntensity).toBeGreaterThan(0);
        expect(result.stayedConstant).toBe(true);
    });
});
