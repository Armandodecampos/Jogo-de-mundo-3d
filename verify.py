
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8000")
        await page.click("#startButton")
        await page.wait_for_function("window.isWorldReady")

        # Create a mound to observe the texture
        await page.evaluate("() => { window.createMound(); }")

        await page.screenshot(path="screenshot.png")
        await browser.close()

asyncio.run(main())
