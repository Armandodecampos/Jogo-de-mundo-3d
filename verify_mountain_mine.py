
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console messages and print them to the terminal
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        await page.goto("http://localhost:8000")

        # Start the game
        await page.click("#startButton")

        # Wait for the world to be ready to avoid race conditions
        await page.wait_for_function("() => window.isWorldReady")

        # Allow some time for assets to fully load and render
        await page.wait_for_timeout(2000)

        # --- Test Pickaxe Mining on the Mountain ---

        # Position the player in front of the mountain and set camera rotation
        await page.evaluate("""() => {
            window.playerBody.position.set(0, 40, 50);
            window.camera.rotation.x = -0.2;
            window.camera.rotation.y = Math.PI;
        }""")

        await page.wait_for_timeout(500)

        # Move the pickaxe from the backpack to the active inventory slot (beltItems[0])
        # and explicitly set the selected slot index to ensure it's active.
        await page.evaluate("() => { beltItems[0] = backpackItems[1]; backpackItems[1] = null; window.setSelectedSlotIndex(0); updateBackpackDisplay(); }")

        await page.wait_for_timeout(200)

        # Click the canvas to gain pointer lock, which is required for mouse events.
        await page.click("canvas")
        await page.wait_for_timeout(200)

        # Move the mouse to the center of the screen to aim at the mountain
        await page.mouse.move(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)

        # Simulate a long press to trigger the mining action
        await page.mouse.down()
        await page.wait_for_timeout(1500) # Hold for 1.5 seconds to ensure the action completes
        await page.mouse.up()

        # Wait a moment to see the final result and any lingering particles
        await page.wait_for_timeout(500)

        await page.screenshot(path="pickaxe_test.png")

        await browser.close()

asyncio.run(main())
