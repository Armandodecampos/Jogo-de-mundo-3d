import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Get the absolute path to the index.htm file
        file_path = os.path.abspath('index.htm')

        # Go to the local file
        await page.goto(f'file://{file_path}')

        # 1. Start the game
        await page.click('#startButton')

        # It takes a moment for the game to load, let's give it a second
        await page.wait_for_timeout(1000)

        # 2. Click on the canvas to ensure pointer lock
        await page.click('canvas')
        await page.wait_for_timeout(500)

        # 3. Open backpack
        await page.keyboard.press('b')
        await page.wait_for_timeout(500)

        # 4. Drag tree sapling to the belt
        await page.drag_and_drop('#backpack-slot-5', '#belt-slot-1')
        await page.wait_for_timeout(500)

        # 5. Close backpack
        await page.keyboard.press('b')
        await page.wait_for_timeout(500)

        # Re-acquire pointer lock
        await page.click('canvas')
        await page.wait_for_timeout(500)

        # 6. Select the sapling
        await page.keyboard.press('e')
        await page.wait_for_timeout(500)

        # 7. Place the sapling
        await page.click('canvas', position={'x': 500, 'y': 300}, force=True)
        await page.wait_for_timeout(500)

        # 8. Wait for the tree to grow
        await page.wait_for_timeout(22000) # Wait for it to become an adult tree

        # 9. Open backpack again to get the texture applicator
        await page.keyboard.press('b')
        await page.wait_for_timeout(500)

        # 10. Drag texture applicator to the belt
        await page.drag_and_drop('#backpack-slot-2', '#belt-slot-1')
        await page.wait_for_timeout(500)

        # 11. Close backpack
        await page.keyboard.press('b')
        await page.wait_for_timeout(500)

        # Re-acquire pointer lock again
        await page.click('canvas', force=True)
        await page.wait_for_timeout(500)

        # 12. Select the texture applicator
        await page.keyboard.press('e')
        await page.wait_for_timeout(500)

        # 13. Apply texture
        await page.click('canvas', position={'x': 700, 'y': 350}, force=True)
        await page.wait_for_timeout(500)

        # 14. Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())