
import asyncio
from playwright.async_api import async_playwright

async def verify_stone():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8080/index.htm")
        await page.wait_for_selector("#startButton")
        await page.click("#startButton")

        # Espera o mundo carregar
        await page.wait_for_function("window.isWorldReady === true")

        # Testa a lógica de recompensa diretamente
        result = await page.evaluate("""() => {
            const hfGridSize = window.hfGridSize;
            const step = 1200 / (hfGridSize - 1);

            // Simula cavar fundo em (10, 10)
            const mound = {
                position: { x: 10, y: -15, z: 10 },
                height: 0,
                growthStage: 3
            };

            const currentDigHeight = mound.position.y + mound.height;
            const stoneLevel = window.stoneLayerLevel;
            const itemToGive = currentDigHeight < stoneLevel ? 'pedra' : 'terra';

            return {
                height: currentDigHeight,
                stoneLevel: stoneLevel,
                item: itemToGive
            };
        }""")

        print(f"Resultado: {result}")
        assert result['item'] == 'pedra', "Deveria dar pedra em -15m"

        # Testa o shader (se uStoneLayerLevel está correto)
        shader_val = await page.evaluate("""() => {
            const mesh = window.islandMeshes[0].mesh;
            return mesh.material.userData.shader.uniforms.uStoneLayerLevel.value;
        }""")
        print(f"Shader uStoneLayerLevel: {shader_val}")
        assert shader_val == -10.0

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_stone())
