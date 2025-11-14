
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:8000")
            await page.click("#startButton")

            # Wait for the game to be ready
            await page.wait_for_function("() => window.isWorldReady")

            # Select the shovel
            await page.evaluate("() => { window.selectedSlotIndex = 0; window.updateBeltDisplay(); }")

            # Dig a hole
            await page.evaluate("() => { window.createMound(); }")

            # Give it a moment to render
            await asyncio.sleep(1)

            await page.screenshot(path="mound_texture_fix.png")
            print("Screenshot taken.")
        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

asyncio.run(main())
