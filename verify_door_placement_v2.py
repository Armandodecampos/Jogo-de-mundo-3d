import asyncio
from playwright.async_api import async_playwright
import os

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        url = "http://localhost:8080/index.htm"

        try:
            print(f"Loading {url}...")
            await page.goto(url)

            # Click start button to initialize everything
            print("Clicking Play button...")
            await page.click("#startButton")

            # Wait for world to be ready
            print("Waiting for world readiness...")
            await page.wait_for_function("window.isWorldReady === true", timeout=20000)
            print("World ready!")

            # Add door to inventory and place it
            print("Attempting to place door...")
            await page.evaluate("""
                const item = { name: window.doorItemName, quantity: 1 };
                // Call addItemToInventory (the global version takes backpackItems as first arg if called like this,
                // but let's just use the exposed window function which was defined in init())
                window.addItemToInventory(window.backpackItems, item, Infinity, true);

                window.beltItems[0] = item;
                window.selectedSlotIndex = 0;

                const pos = new THREE.Vector3(5, 0, 0);
                const quat = new THREE.Quaternion();

                window.ghostBlockMesh.visible = true;
                window.ghostBlockMesh.position.copy(pos);
                window.ghostBlockMesh.quaternion.copy(quat);
                window.ghostBlockMesh.material.color.setHex(0x00ff00);

                window.placeBlock(window.beltItems[0], 0);
            """)

            await asyncio.sleep(1)

            door_exists = await page.evaluate("""
                () => {
                    return window.placedConstructionBodies.some(b => b.userData.type === window.doorItemName);
                }
            """)

            print(f"Door exists in world: {door_exists}")

            # Take a screenshot
            os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
            await page.screenshot(path="/home/jules/verification/screenshots/door_placed_fixed.png")

            if not door_exists:
                 print("Door was NOT placed. Checking beltItems[0]:")
                 belt_item = await page.evaluate("window.beltItems[0]")
                 print(f"beltItems[0]: {belt_item}")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
