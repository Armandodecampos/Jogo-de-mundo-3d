
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        await page.goto("http://localhost:8000")

        # Click the start button and wait for the world to be ready
        await page.evaluate("document.getElementById('startButton').click()")
        await page.wait_for_function("window.isWorldReady")

        # Expose createMound function for testing
        await page.evaluate("window.createMound = createMound")

        # Use shovel
        await page.evaluate("beltItems[0] = { name: 'pá', quantity: 1 }; updateBeltDisplay();")
        await page.evaluate("selectedSlotIndex = 0; updateBeltDisplay();")

        # Create mound
        await page.evaluate("createMound()")

        await asyncio.sleep(2)  # Wait for mound to render

        await page.screenshot(path="verify_texture.png")
        await browser.close()

asyncio.run(main())
