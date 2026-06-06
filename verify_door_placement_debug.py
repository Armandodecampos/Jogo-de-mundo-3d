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
            response = await page.goto(url)
            print(f"Status: {response.status}")

            # Check if page is blank or has errors
            content = await page.content()
            print(f"Content length: {len(content)}")

            # Log console messages
            page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

            # Wait for world to be ready or just wait a bit
            print("Waiting for world readiness...")
            try:
                await page.wait_for_function("window.isWorldReady === true", timeout=10000)
                print("World ready!")
            except Exception as e:
                print(f"World readiness timeout: {e}")
                # Try to see why it's not ready
                is_ready = await page.evaluate("window.isWorldReady")
                print(f"window.isWorldReady is: {is_ready}")

            # Add door to inventory and place it
            print("Attempting to place door...")
            await page.evaluate("""
                if (!window.isWorldReady) {
                    console.log("Forcing world ready state for test...");
                    window.isWorldReady = true;
                }
                const item = { name: window.doorItemName, quantity: 1 };
                window.addItemToInventory(item, true);

                window.beltItems[0] = item;
                window.selectedSlotIndex = 0;

                const pos = new THREE.Vector3(2, 1, 0); // Above ground a bit
                const quat = new THREE.Quaternion();

                window.ghostBlockMesh.visible = true;
                window.ghostBlockMesh.position.copy(pos);
                window.ghostBlockMesh.quaternion.copy(quat);
                window.ghostBlockMesh.material.color.setHex(0x00ff00);

                console.log("Calling placeBlock with", item.name);
                window.placeBlock(window.beltItems[0], 0);
            """)

            await asyncio.sleep(1) # Wait for placement to process

            door_exists = await page.evaluate("""
                () => {
                    const exists = window.placedConstructionBodies.some(b => b.userData.type === window.doorItemName);
                    console.log("Door exists in placedConstructionBodies:", exists);
                    return exists;
                }
            """)

            print(f"Door exists in world: {door_exists}")

            # Take a screenshot
            os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
            await page.screenshot(path="/home/jules/verification/screenshots/door_debug.png")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
