
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture and print console messages
        page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))

        await page.goto("http://localhost:8000")

        # Click the start button
        await page.click("#startButton")

        # Wait for a fixed time to allow assets to load
        await page.wait_for_timeout(5000)

        # Programmatically call the digHole function
        await page.evaluate("() => digHole()")

        # Wait for the geometry to update
        await page.wait_for_timeout(1000)

        await page.screenshot(path="jules-scratch/verification/hole.png")

        await browser.close()

asyncio.run(main())
