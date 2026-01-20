
from playwright.async_api import async_playwright
import asyncio

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:8000")
            await page.click("#startButton")
            # Wait for the world to be ready
            await page.wait_for_function("() => window.isWorldReady", timeout=60000)
            await asyncio.sleep(5) # Wait for 5 seconds to ensure everything is loaded
            await page.screenshot(path="verification.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
