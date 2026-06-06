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
            await page.click("#startButton")
            await page.wait_for_function("window.isWorldReady === true", timeout=20000)

            # Add door to inventory
            await page.evaluate("""
                const item = { name: window.doorItemName, quantity: 5 };
                window.addItemToInventory(window.backpackItems, item, Infinity, true);
                window.updateBeltDisplay();

                // Select first slot
                window.selectedSlotIndex = 0;

                // Move player and look down at ground
                window.playerBody.position.set(10, 2, 10);
                window.camera.position.set(10, 3, 10);
                window.camera.lookAt(10, 0, 8); // Look at ground in front
            """)

            await asyncio.sleep(2)

            # Check state
            state = await page.evaluate("""
                () => {
                    return {
                        visible: window.ghostBlockMesh.visible,
                        color: window.ghostBlockMesh.material.color.getHex().toString(16),
                        pos: window.ghostBlockMesh.position,
                        type: window.currentBlockType,
                        isPlacing: window.isPrimaryToolPlacing
                    };
                }
            """)
            print(f"Ghost State: {state}")

            # Click to place
            print("Dispatching mousedown...")
            await page.evaluate("""
                const event = new MouseEvent('mousedown', { button: 0 });
                window.renderer.domElement.dispatchEvent(event);
            """)

            await asyncio.sleep(1)

            door_count = await page.evaluate("""
                () => window.placedConstructionBodies.filter(b => b.userData.type === window.doorItemName).length
            """)
            print(f"Door count in world: {door_count}")

            os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
            await page.screenshot(path="/home/jules/verification/screenshots/door_click_test.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
