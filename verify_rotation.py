
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:8000")

            # Click the start button
            await page.evaluate('document.getElementById("startButton").click()')

            # Wait for the game world to be ready
            await page.wait_for_function('window.isWorldReady === true')

            # Switch to the shovel (it's in the left hand, slot 0, which is selected by default)
            # No action needed to switch if it's the default.

            # Programmatically create a mound to ensure it's in view
            await page.evaluate('window.createMound()')

            # Wait a bit for the mound to render
            await page.wait_for_timeout(500)

            await page.screenshot(path="rotated_hole.png")
            print("Screenshot taken.")
        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

asyncio.run(main())
