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

            print("Placing door...")
            await page.evaluate("""
                const item = { name: window.doorItemName, quantity: 1 };
                window.addItemToInventory(window.backpackItems, item, Infinity, true);
                window.beltItems[0] = item;
                window.selectedSlotIndex = 0;

                const pos = new THREE.Vector3(5, 0, -5);
                window.ghostBlockMesh.visible = true;
                window.ghostBlockMesh.position.copy(pos);
                window.ghostBlockMesh.material.color.setHex(0x00ff00);

                window.placeBlock(window.beltItems[0], 0);
                window.ghostBlockMesh.visible = false;

                // Move camera to look at the door
                window.camera.position.set(5, 2, 5);
                window.camera.lookAt(5, 0, -5);
            """)

            await asyncio.sleep(2)

            door_info = await page.evaluate("""
                () => {
                    const body = window.placedConstructionBodies.find(b => b.userData.type === window.doorItemName);
                    if (!body) return null;
                    return {
                        pos: body.position,
                        isOpen: body.userData.isOpen,
                        meshVisible: body.userData.visualMesh.visible
                    };
                }
            """)

            print(f"Door info: {door_info}")

            os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
            await page.screenshot(path="/home/jules/verification/screenshots/door_placed_v3.png")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
