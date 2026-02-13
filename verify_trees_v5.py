import asyncio
from playwright.async_api import async_playwright
import math

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Acessar o jogo
        await page.goto("http://localhost:8080")

        # Clicar em 'Jogar'
        await page.click("button:has-text('Jogar')")

        # Esperar o mundo carregar (JS usa true minúsculo)
        await page.wait_for_function("window.isWorldReady === true")

        # Esperar um pouco para as árvores carregarem
        await asyncio.sleep(2)

        # Extrair dados das árvores
        trees = await page.evaluate("""() => {
            return window.placedConstructionBodies
                .filter(body => body.userData.type === 'muda_arvore' || body.userData.growthStage)
                .map(body => ({
                    type: body.userData.type,
                    growthStage: body.userData.growthStage,
                    x: body.position.x,
                    y: body.position.y,
                    z: body.position.z
                }));
        }""")

        print(f"Found {len(trees)} trees/saplings.")

        if len(trees) < 2:
            print("Not enough trees to calculate distance.")
        else:
            min_dist = float('inf')
            for i in range(len(trees)):
                for j in range(i + 1, len(trees)):
                    t1 = trees[i]
                    t2 = trees[j]
                    dist = math.sqrt((t1['x'] - t2['x'])**2 + (t1['z'] - t2['z'])**2)
                    if dist < min_dist:
                        min_dist = dist

            print(f"Minimum distance found: {min_dist}")

            if min_dist < 6.0:
                print("SUCCESS: Minimum distance is below the original 6.0 limit.")
            else:
                print("FAILURE: Minimum distance is still above 6.0.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
