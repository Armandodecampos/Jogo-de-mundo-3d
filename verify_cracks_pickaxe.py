
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs for debugging
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            await page.goto("http://localhost:8000")

            # Click the start button
            await page.locator("#startButton").click()

            # Wait for the world to be ready
            await page.wait_for_function("window.isWorldReady === true", timeout=30000)
            print("World is ready.")

            # Select the pickaxe (slot index 1)
            await page.evaluate("window.setSelectedSlotIndex(1)")
            print("Switched to pickaxe.")

            # Reposition the player in front of the mountain
            await page.evaluate("""() => {
                window.playerBody.position.set(0, window.playerBody.position.y, 45);
                window.playerBody.velocity.set(0, 0, 0);
            }""")
            print("Player repositioned.")

            # Give a moment for physics to settle
            await page.wait_for_timeout(500)

            # Rotate camera to face the mountain
            await page.evaluate("""() => {
                window.camera.rotation.y = 0; // Face forward (towards negative Z)
                window.camera.rotation.x = -0.2; // Look slightly down
            }""")
            print("Camera rotated.")

            # Give another moment for the camera to update
            await page.wait_for_timeout(500)

            # Simulate a mouse click in the center of the screen to trigger destruction
            await page.mouse.move(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)
            await page.mouse.down()
            await page.wait_for_timeout(100) # Short press
            await page.mouse.up()

            print("Clicked with pickaxe.")

            # Wait for the crack effect to be visible
            await page.wait_for_timeout(1000)

            # Take a screenshot to verify the result
            screenshot_path = "verify_cracks_pickaxe.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

asyncio.run(main())
