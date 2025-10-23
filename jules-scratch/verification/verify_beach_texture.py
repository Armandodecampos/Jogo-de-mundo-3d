
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8000")

        # Click the start button
        await page.locator("#startButton").click()

        # Wait for the game world to be ready by polling for a game-specific variable
        await page.wait_for_function("window.stoneDeposits && window.stoneDeposits.length > 0")

        # Wait a bit more for textures to load, just in case
        await page.wait_for_timeout(2000)

        await page.screenshot(path="jules-scratch/verification/verification.png")
        await browser.close()

asyncio.run(main())
