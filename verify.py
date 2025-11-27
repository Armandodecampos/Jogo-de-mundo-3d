
import asyncio
from playwright.async_api import async_playwright
import time

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        await page.goto("http://localhost:8000")

        # Start the game
        await page.click("#startButton")

        # Wait for the world to be ready
        await page.wait_for_function("() => window.isWorldReady")

        # Allow some time for assets to load and render
        await page.wait_for_timeout(2000)

        # --- Test 1: Pickaxe Mining ---

        # Set player position and camera rotation to look at the mountain
        await page.evaluate("""() => {
            window.playerBody.position.set(0, 40, 50);
            window.camera.rotation.x = -0.2;
            window.camera.rotation.y = Math.PI;
        }""")

        await page.wait_for_timeout(500)

        # Select the pickaxe. First, move it from the backpack to the active slot (beltItems[0]).
        # backpackItems[1] is the pickaxe. Also explicitly set the selected slot index.
        await page.evaluate("() => { beltItems[0] = backpackItems[1]; backpackItems[1] = null; window.setSelectedSlotIndex(0); updateBackpackDisplay(); }")

        await page.wait_for_timeout(200)

        # Click canvas to gain pointer lock, which is required for mouse events.
        await page.click("canvas")
        await page.wait_for_timeout(200)

        # Move the mouse to the center of the screen to aim at the mountain
        await page.mouse.move(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)

        # Simulate a long press to mine the mountain
        await page.mouse.down()
        await page.wait_for_timeout(1100) # Wait for the mining action to complete
        await page.mouse.up()

        await page.wait_for_timeout(500) # Wait for particles to appear

        await page.screenshot(path="/home/jules/verification/pickaxe_mining_action.png")

        # --- Test 2: Shovel Digging ---

        # Set player position and camera rotation to look at the ground
        await page.evaluate("""() => {
            window.playerBody.position.set(0, 5, -5);
            window.camera.rotation.x = -0.8;
            window.camera.rotation.y = 0;
            beltItems[0] = { name: 'pá', quantity: 1 }; // Equip shovel
            window.setSelectedSlotIndex(0);
        }""")

        await page.wait_for_timeout(500)

        # Click canvas to gain pointer lock
        await page.click("canvas")
        await page.wait_for_timeout(200)

        # Move the mouse to the center of the screen to aim at the ground
        await page.mouse.move(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)

        # Simulate a long press to dig a hole
        await page.mouse.down()
        await page.wait_for_timeout(1100) # Wait for the digging action to complete
        await page.mouse.up()

        await page.wait_for_timeout(500) # Wait for the mound to appear

        await page.screenshot(path="/home/jules/verification/shovel_digging_action.png")


        await browser.close()

asyncio.run(main())
