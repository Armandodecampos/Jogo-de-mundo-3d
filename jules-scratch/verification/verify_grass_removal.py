
import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get the absolute path to the HTML file
        file_path = os.path.abspath('index.htm')

        # Go to the local HTML file
        await page.goto(f'file://{file_path}')

        # Wait for the start button and click it
        await page.wait_for_selector('#startButton', state='visible')
        await page.click('#startButton')

        # Wait for the game to load (e.g., for the crosshair to be visible)
        await page.wait_for_selector('#crosshair', state='visible')

        # Take a screenshot
        await page.screenshot(path='jules-scratch/verification/verification.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
