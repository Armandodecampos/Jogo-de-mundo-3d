import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8080")
        await page.click("button:has-text('Jogar')")
        await page.wait_for_function("window.isWorldReady === true")

        # Aumentar a quantidade de árvores para 1000 para forçar proximidade
        await page.evaluate("""() => {
            targetTreeCount = 1000;
            populateTrees();
        }""")

        # Esperar as árvores carregarem
        await asyncio.sleep(3)

        # Mover a câmera para cima para ver melhor
        await page.evaluate("""() => {
            playerBody.position.set(0, 100, 0);
            camera.rotation.set(-Math.PI/2, 0, 0);
        }""")

        # Tirar screenshot
        await page.screenshot(path="dense_trees.png")
        print("Screenshot saved to dense_trees.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
