
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8000")
        await page.click("#startButton")
        # Wait for the game to load by checking for the stone deposits
        await page.wait_for_function("() => window.stoneDeposits && window.stoneDeposits.length > 0")

        # Switch to the texture applicator tool (assuming it's in the inventory)
        await page.evaluate("() => { beltItems[1] = { name: 'pincel', quantity: 1 }; updateBeltDisplay(); selectedSlotIndex = 1; }")

        # Move the mouse to the center of the screen to aim
        await page.mouse.move(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)

        # Click to apply the texture
        await page.mouse.down()
        await page.mouse.up()

        await page.screenshot(path="verification.png")
        await browser.close()

asyncio.run(main())
