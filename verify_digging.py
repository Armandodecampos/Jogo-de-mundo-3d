
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        await page.goto("http://localhost:8000")

        # Click the start button and wait for the game to load
        await page.evaluate("document.getElementById('startButton').click()")

        # Wait for the isWorldReady flag to be true
        try:
            await page.wait_for_function("window.isWorldReady === true", timeout=30000)
            print("World is ready!")
        except Exception as e:
            print(f"Timeout waiting for world to be ready: {e}")
            await browser.close()
            return

        # Select the shovel
        await page.evaluate("() => { beltItems[0] = { name: 'pá', quantity: 1 }; updateBeltDisplay(); }")
        await page.evaluate("() => { selectedSlotIndex = 0; updateBeltDisplay(); }")

        # Get canvas element
        canvas = await page.query_selector('canvas')
        if not canvas:
            print("Canvas not found!")
            await browser.close()
            return

        # Simulate a long mouse press on the canvas
        bounding_box = await canvas.bounding_box()
        if bounding_box:
            x = bounding_box['x'] + bounding_box['width'] / 2
            y = bounding_box['y'] + bounding_box['height'] / 2

            print("Simulating mouse down...")
            await page.mouse.move(x, y)
            await page.mouse.down()

            # Wait for the progress bar to appear and fill up
            await asyncio.sleep(2.5)

            print("Simulating mouse up...")
            await page.mouse.up()

            # Take a screenshot to verify
            await page.screenshot(path="digging_progress.png")
            print("Screenshot 'digging_progress.png' taken.")

        await browser.close()

asyncio.run(main())
