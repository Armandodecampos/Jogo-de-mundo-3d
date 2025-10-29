import asyncio
from playwright.async_api import async_playwright
import time

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs from the page
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            print("Navigating to the page...")
            await page.goto("http://localhost:8080/index.htm", timeout=60000)

            print("Clicking start button...")
            await page.evaluate("document.getElementById('startButton').click()")

            print("Waiting for world to be ready...")
            await page.wait_for_function("window.isWorldReady === true", timeout=90000)

            # Increased wait time to be safe
            print("Waiting for an additional 10 seconds for assets to settle...")
            await asyncio.sleep(10)

            print("Equipping shovel...")
            await page.evaluate("""() => {
                window.beltItems[0] = { name: 'pá', quantity: 1 };
                window.selectedSlotIndex = 0;
                window.updateBeltDisplay();
            }""")

            print("Simulating mouse down to dig...")
            canvas = page.locator('canvas')
            box = await canvas.bounding_box()
            await page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
            await page.mouse.down()
            await asyncio.sleep(0.3)
            await page.mouse.up()
            print("Dig action complete.")

            print("Waiting for hole to render...")
            await asyncio.sleep(2)

            print("Taking screenshot...")
            await page.screenshot(path="hole_verification.png")
            print("Screenshot 'hole_verification.png' taken successfully.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            # Take a screenshot on error to help debug
            await page.screenshot(path="error_screenshot.png")
            print("Error screenshot taken as 'error_screenshot.png'.")
        finally:
            print("Closing browser.")
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
