import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8080")
        await page.click("button:has-text('Jogar')")
        await page.wait_for_function("window.isWorldReady === true")

        # Esperar as árvores carregarem
        await asyncio.sleep(2)

        # Tirar screenshot
        await page.screenshot(path="final_trees_proximity.png")
        print("Screenshot saved to final_trees_proximity.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
