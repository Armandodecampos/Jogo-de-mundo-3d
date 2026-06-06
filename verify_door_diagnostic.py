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

            # Diagnostic: check item names and getActionType
            diag = await page.evaluate("""
                () => {
                    const door = window.doorItemName;
                    const action = window.getActionType({name: door});
                    const recipes = window.recipes?.workbench;
                    const doorRecipe = recipes ? recipes.find(r => r.item === door) : null;
                    return { door, action, doorRecipe };
                }
            """)
            print(f"Diagnostic: {diag}")

            # Force placement bypass ghost check
            print("Force placing door via script...")
            success = await page.evaluate("""
                () => {
                    const door = window.doorItemName;
                    const pos = new THREE.Vector3(5, 1.2, 5); // 1.2m up for 2.4m door
                    const quat = new THREE.Quaternion();
                    window.createPlaceableBlock(pos, quat, door);
                    return window.placedConstructionBodies.some(b => b.userData.type === door);
                }
            """)
            print(f"Force placement success: {success}")

            # Now try to test the actual placement logic
            print("Testing ghost visibility logic...")
            ghost_visible = await page.evaluate("""
                () => {
                    const item = { name: window.doorItemName, quantity: 5 };
                    window.beltItems[0] = item;
                    window.selectedSlotIndex = 0;

                    // Simulate aiming at ground
                    window.playerBody.position.set(0, 5, 0);
                    window.camera.position.set(0, 6, 0);
                    window.camera.lookAt(0, 0, 5);

                    // We need to wait for a frame for 'animate' to update ghostBlockMesh
                    return new Promise(resolve => {
                        requestAnimationFrame(() => {
                            resolve({
                                visible: window.ghostBlockMesh.visible,
                                color: window.ghostBlockMesh.material.color.getHex().toString(16),
                                type: window.currentBlockType,
                                isPlacing: window.isPrimaryToolPlacing,
                                targetHit: !!window.currentLookedAtBody || true // Simplified
                            });
                        });
                    });
                }
            """)
            print(f"Ghost logic results: {ghost_visible}")

            os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
            await page.screenshot(path="/home/jules/verification/screenshots/door_diagnostic.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
