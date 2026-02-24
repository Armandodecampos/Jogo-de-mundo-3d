
import asyncio
from playwright.async_api import async_playwright

async def verify_boundaries():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8080/index.htm")
        await page.wait_for_selector("#startButton")
        await page.click("#startButton")
        await page.wait_for_function("window.isWorldReady === true")

        result = await page.evaluate("""() => {
            const hfGridSize = window.hfGridSize;

            // Modifica a borda esquerda (x = -600)
            const mound = {
                position: { x: -600, y: 0, z: 0 },
                height: 1.0,
                growthStage: 4
            };
            window.updateIslandGeometry(mound);

            // Verifica se a borda direita (x = 600) foi afetada (toroidal)
            const leftVal = window.currentHfMatrix[0][hfGridSize/2];
            const rightVal = window.currentHfMatrix[hfGridSize-1][hfGridSize/2];

            return {
                leftVal,
                rightVal,
                match: Math.abs(leftVal - rightVal) < 0.1
            };
        }""")

        print(f"Resultado Fronteira: {result}")
        assert result['match'] == True, "Bordas opostas deveriam ter a mesma altura"

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_boundaries())
