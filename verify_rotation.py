
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8000")

        # Click the start button and wait for the game to load
        await page.locator("#startButton").click()
        await page.wait_for_function("window.isWorldReady")

        # Programmatically select the shovel (it's in belt slot 0 by default)
        await page.evaluate("() => { selectedSlotIndex = 0; updateBeltDisplay(); }")

        # Simulate a short click to dig a hole in the center of the screen
        await page.mouse.down()
        await asyncio.sleep(0.1) # Short delay to simulate a click
        await page.mouse.up()

        # Wait a moment for the hole to be created
        await asyncio.sleep(1)

        await page.screenshot(path="verify_hole_rotation.png")
        await browser.close()

asyncio.run(main())
