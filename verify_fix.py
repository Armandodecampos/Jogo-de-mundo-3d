
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        await page.goto("http://localhost:8000")

        # Click the start button
        await page.locator("#startButton").click()

        # Wait for the world to be ready
        await page.wait_for_function("window.isWorldReady === true")

        # Wait for a moment to ensure rendering
        await page.wait_for_timeout(2000)

        await page.screenshot(path="screenshot.png")
        await browser.close()

asyncio.run(main())
