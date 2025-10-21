
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console messages
        page.on('console', lambda msg: print(f"Browser console: {msg.text}"))

        await page.goto('http://localhost:8000')

        # Start the game
        await page.click('#startButton')

        # Wait for the game to load
        await page.wait_for_function('window.world !== undefined', timeout=60000)

        # Move the mouse to aim at the stone deposit
        await page.mouse.move(500, 500)

        # Press and hold the left mouse button
        await page.mouse.down()

        # Wait for the destruction to complete
        await asyncio.sleep(2)

        # Release the mouse button
        await page.mouse.up()

        # Take a screenshot
        await page.screenshot(path='jules-scratch/verification/destruction_verification.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
