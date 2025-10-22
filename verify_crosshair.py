
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs from the page
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            await page.goto("http://localhost:8000")

            # Click the start button
            await page.click("#startButton", timeout=5000)

            # Wait for the game world to be ready by polling the global flag
            await page.wait_for_function("window.isWorldReady", timeout=30000)
            print("World is ready.")

            # Add a short delay to ensure the UI is fully interactive
            await asyncio.sleep(1)

            # --- Step 1: Equip a placeable item (cob) ---
            await page.evaluate("""() => {
                // Find the cob item in the backpack
                const cobIndex = window.backpackItems.findIndex(item => item && item.name === window.cobItemName);
                if (cobIndex !== -1) {
                    // Swap it with the item in the selected belt slot (axe)
                    const cobItem = window.backpackItems[cobIndex];
                    window.backpackItems[cobIndex] = window.beltItems[window.selectedSlotIndex];
                    window.beltItems[window.selectedSlotIndex] = cobItem;
                    window.updateBeltDisplay();
                    console.log('Cob item equipped to belt slot ' + window.selectedSlotIndex);
                } else {
                    console.error('Cob item not found in backpack!');
                }
            }""")

            # --- Step 2: Point camera at a valid location and check crosshair ---
            print("Testing valid placement location...")
            await page.evaluate("""() => {
                // Point camera down at the ground in front of the player
                window.camera.rotation.x = -Math.PI / 4; // 45 degrees down
                window.camera.rotation.y = 0;
            }""")

            # The animate loop needs to run for the raycaster and color to update
            await asyncio.sleep(0.5)

            crosshair = page.locator("#crosshair")

            # Use get_computed_style to check the pseudo-element's color
            crosshair_color = await crosshair.evaluate("element => getComputedStyle(element, '::before').backgroundColor")
            print(f"Crosshair color on valid ground: {crosshair_color}")
            if crosshair_color != 'rgb(0, 255, 0)': # lime
                 raise Exception(f"Validation failed: Crosshair color on valid ground was {crosshair_color}, expected rgb(0, 255, 0)")


            # --- Step 3: Point camera at an invalid location (stone deposit) ---
            print("Testing invalid placement location (stone deposit)...")
            # Find the first stone deposit to aim at
            await page.evaluate("""() => {
                const deposit = window.stoneDeposits[0];
                if (deposit) {
                    const direction = new THREE.Vector3(deposit.x, deposit.y, deposit.z).sub(window.camera.position).normalize();
                    const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction));
                    window.camera.rotation.copy(euler);
                    console.log(`Aimed camera at stone deposit at (${deposit.x}, ${deposit.y}, ${deposit.z})`);
                } else {
                    console.error('No stone deposits found to aim at!');
                }
            }""")

            await asyncio.sleep(0.5)

            crosshair_color = await crosshair.evaluate("element => getComputedStyle(element, '::before').backgroundColor")
            print(f"Crosshair color on stone deposit: {crosshair_color}")
            if crosshair_color != 'rgb(255, 0, 0)': # red
                 raise Exception(f"Validation failed: Crosshair color on stone deposit was {crosshair_color}, expected rgb(255, 0, 0)")


            # --- Step 4: Point camera at the sky (another invalid location) ---
            print("Testing invalid placement location (sky)...")
            await page.evaluate("""() => {
                // Point camera up at the sky
                window.camera.rotation.x = Math.PI / 3; // 60 degrees up
            }""")

            await asyncio.sleep(0.5)

            crosshair_color = await crosshair.evaluate("element => getComputedStyle(element, '::before').backgroundColor")
            print(f"Crosshair color on sky: {crosshair_color}")
            # When pointing at the sky, the ghost block is not visible, and the crosshair should be red.
            if crosshair_color != 'rgb(255, 0, 0)': # red
                 raise Exception(f"Validation failed: Crosshair color on sky was {crosshair_color}, expected rgb(255, 0, 0)")


            print("All crosshair verification tests passed!")

        except Exception as e:
            print(f"An error occurred: {e}")
            # You might want to take a screenshot on failure for debugging
            # await page.screenshot(path="failure_screenshot.png")
            raise  # Re-raise the exception to make the script exit with a non-zero code

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
