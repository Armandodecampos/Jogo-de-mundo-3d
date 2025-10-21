import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Get the absolute path to the HTML file
        import os
        file_path = os.path.abspath('index.htm')

        await page.goto(f'file://{file_path}')

        # Click the "Jogar" button to start the game
        await page.locator('button#startButton').click()

        # Wait for the canvas to be visible, indicating the game has started
        await expect(page.locator('canvas')).to_be_visible()

        # Give the scene a moment to render
        await page.wait_for_timeout(2000)

        # Take a screenshot to verify the fix
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
