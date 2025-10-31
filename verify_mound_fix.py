import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page error: {err}"))

        try:
            await page.goto("http://localhost:8000")

            print("Page loaded. Clicking start button...")
            # Use evaluate to click the button robustly
            await page.evaluate("document.getElementById('startButton').click()")

            print("Waiting for world to be ready...")
            await page.wait_for_function("window.isWorldReady", timeout=30000)
            print("World is ready.")

            # Find the shovel in the inventory
            shovel_inventory_location = await page.evaluate("""
                () => {
                    const inventory = window.inventory;
                    const shovelItemName = 'pá';

                    // Check belt first
                    const beltIndex = inventory.belt.findIndex(item => item && item.name === shovelItemName);
                    if (beltIndex !== -1) {
                        return { BQ_inventory: 'belt', BQ_index: beltIndex };
                    }

                    // Check backpack
                    const backpackIndex = inventory.backpack.findIndex(item => item && item.name === shovelItemName);
                    if (backpackIndex !== -1) {
                        return { BQ_inventory: 'backpack', BQ_index: backpackIndex };
                    }

                    return null;
                }
            """)

            if not shovel_inventory_location:
                print("Shovel not found in inventory!")
                await browser.close()
                return

            print(f"Shovel found at: {shovel_inventory_location}")

            # If shovel is in backpack, move it to the active slot (e.g., index 1)
            # This part is complex to simulate with drag-and-drop, so we'll use a setter for now.
            # Assuming the primary action slot is index 0 or 1. Let's use 0.
            await page.evaluate(f"""
                () => {{
                    const shovel = window.inventory.backpack.find(item => item && item.name === 'pá');
                    if (shovel) {{
                        window.inventory.belt[0] = shovel; // Move to left hand
                        window.setSelectedSlotIndex(0); // Select left hand
                    }}
                }}
            """)
            print("Shovel equipped to belt slot 0.")

            print("Attempting to dig...")
            # Simulate a short click on the canvas to dig
            await page.evaluate("""
                () => {
                    const canvas = document.querySelector('canvas');
                    const downEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, button: 0 });
                    const upEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, button: 0 });
                    canvas.dispatchEvent(downEvent);
                    canvas.dispatchEvent(upEvent);
                }
            """)

            print("Dig action simulated. Waiting a moment...")
            await page.wait_for_timeout(1000) # Wait for physics and visuals to update

            # Check the mounds (now holes) array
            holes_array = await page.evaluate("window.holes")
            print(f"Holes array content: {holes_array}")

            if holes_array and len(holes_array) > 0:
                print("SUCCESS: A mound/hole was created in the data array.")
            else:
                print("FAILURE: No mound/hole was created in the data array.")

            # Take a screenshot for visual verification
            screenshot_path = "mound_verification_fix.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
