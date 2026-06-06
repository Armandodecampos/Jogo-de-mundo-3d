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

            # Setup inventory and view
            await page.evaluate("""
                const door = { name: window.doorItemName, quantity: 5 };
                window.beltItems[0] = door;
                window.selectedSlotIndex = 0;
                window.updateBeltDisplay();

                // Position player
                window.playerBody.position.set(10, 5, 10);
                window.camera.position.set(10, 6, 10);
                window.camera.lookAt(10, 0, 0); // Look towards ground

                // Mock pointer lock
                window.renderer.domElement.requestPointerLock = () => { document.pointerLockElement = window.renderer.domElement; };
            """)

            await page.click("canvas")

            # Wait for a few frames for animate to update ghost
            await asyncio.sleep(1)

            # Check ghost
            ghost = await page.evaluate("""
                () => {
                    return {
                        visible: window.ghostBlockMesh.visible,
                        color: window.ghostBlockMesh.material.color.getHex().toString(16),
                        type: window.currentBlockType,
                        pos: window.ghostBlockMesh.position
                    };
                }
            """)
            print(f"Ghost: {ghost}")

            # Click!
            print("Clicking...")
            await page.evaluate("""
                const event = new MouseEvent('mousedown', { button: 0 });
                window.renderer.domElement.dispatchEvent(event);
            """)

            await asyncio.sleep(1)

            door_count = await page.evaluate("""
                () => window.placedConstructionBodies.filter(b => b.userData.type === window.doorItemName).length
            """)
            print(f"Door count: {door_count}")

            os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
            await page.screenshot(path="/home/jules/verification/screenshots/door_user_test_v2.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
