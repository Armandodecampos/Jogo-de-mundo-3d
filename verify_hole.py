
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:8000")

            # Start the game
            await page.click("#startButton")

            # Wait for the game to load
            await page.wait_for_function("() => window.isWorldReady")

            # Equip the shovel (assuming slot 2)
            await page.evaluate("() => { window.setSelectedSlotIndex(1); }")


            # Move mouse to the center of the screen to dig
            await page.mouse.move(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)
            await page.mouse.down()
            await asyncio.sleep(0.1) # Short click
            await page.mouse.up()

            # Wait a bit for the hole to appear
            await asyncio.sleep(1)

            await page.screenshot(path="hole_verification.png")
            print("Screenshot taken. Check hole_verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="error_screenshot.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
