import asyncio
from playwright.async_api import async_playwright
import os

async def run_verification():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Set up a local server for index.htm
        # (Assuming the server is already running on port 8080 as per instructions)
        url = "http://localhost:8080/index.htm"

        try:
            await page.goto(url)

            # Wait for world to be ready
            await page.wait_for_function("window.isWorldReady === true", timeout=30000)

            # Add door to inventory and place it
            await page.evaluate("""
                const item = { name: window.doorItemName, quantity: 1 };
                window.addItemToInventory(item, true);

                // Select the slot with the door (it should be in slot 0 if inventory was empty or we just added it)
                // Actually let's just use window.beltItems[0] to be sure
                window.beltItems[0] = item;
                window.selectedSlotIndex = 0;

                // Position to place (at 2, 0, 0)
                const pos = new THREE.Vector3(2, 0, 0);
                const quat = new THREE.Quaternion();

                // Simulate ghostBlockMesh state for placeBlock
                window.ghostBlockMesh.visible = true;
                window.ghostBlockMesh.position.copy(pos);
                window.ghostBlockMesh.quaternion.copy(quat);
                window.ghostBlockMesh.material.color.setHex(0x00ff00);

                // Call placeBlock
                window.placeBlock(window.beltItems[0], 0);
            """)

            # Check if a door exists in the world
            door_exists = await page.evaluate("""
                () => {
                    return window.placedConstructionBodies.some(b => b.userData.type === window.doorItemName);
                }
            """)

            print(f"Door exists in world: {door_exists}")

            if door_exists:
                # Toggle the door
                await page.evaluate("""
                    const doorBody = window.placedConstructionBodies.find(b => b.userData.type === window.doorItemName);
                    window.toggleDoor(doorBody);
                """)

                # Check state
                is_open = await page.evaluate("""
                    () => {
                        const doorBody = window.placedConstructionBodies.find(b => b.userData.type === window.doorItemName);
                        return doorBody.userData.isOpen;
                    }
                """)
                print(f"Door is open: {is_open}")

            # Take a screenshot
            os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
            await page.screenshot(path="/home/jules/verification/screenshots/door_placed_verification.png")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
