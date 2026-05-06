
import asyncio
from playwright.async_api import async_playwright
import time

async def verify_inventory():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        # Start the game
        try:
            await page.goto('http://localhost:8080')
        except Exception as e:
            print(f"Error connecting to server: {e}.")
            await browser.close()
            return

        await page.click('#startButton')

        # Wait for the world to be ready
        await page.wait_for_function('window.isWorldReady === true')

        # Check all crates
        crates_data = await page.evaluate('''() => {
            const boxes = window.collectibleBoxes;
            return boxes.map(b => ({
                pos: b.body.position,
                inventory: b.body.userData.inventory ? b.body.userData.inventory.map(item => item ? item.name : null) : "No inventory"
            }));
        }''')
        print(f"All crates found: {crates_data}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_inventory())
