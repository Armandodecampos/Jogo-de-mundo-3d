
import asyncio
from playwright.async_api import async_playwright

async def verify_water():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8080/index.htm")
        await page.wait_for_selector("#startButton")
        await page.click("#startButton")
        await page.wait_for_function("window.isWorldReady === true")

        result = await page.evaluate("""() => {
            const hfGridSize = window.hfGridSize;
            const waterLevel = -9.6;

            // 1. Testa um buraco isolado no centro da ilha (deve estar seco)
            window.currentHfMatrix[160][160] = -15; // Centro
            window.updateWaterConnectivity();
            const isCenterWet = window.hasWaterAt(0, 0); // (0,0) é o centro

            // 2. Testa um canal conectado à borda
            for (let i = 0; i < 50; i++) {
                window.currentHfMatrix[i][160] = -15;
            }
            window.updateWaterConnectivity();
            const isCanalWet = window.hasWaterAt(-500, 0);

            return {
                isCenterWet,
                isCanalWet
            };
        }""")

        print(f"Resultado Água: {result}")
        assert result['isCenterWet'] == False, "Buraco no centro deveria estar seco"
        assert result['isCanalWet'] == True, "Canal conectado à borda deveria estar molhado"

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_water())
