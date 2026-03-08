import asyncio
from playwright.async_api import async_playwright
import time
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Start a local server for index.htm
        import subprocess
        server = subprocess.Popen(['python3', '-m', 'http.server', '8082'])
        time.sleep(2)

        await page.goto('http://localhost:8082/index.htm')

        # Click start
        await page.click('#startButton')
        # Wait for world to be ready and trees to spawn
        await page.wait_for_function("window.isWorldReady === true")
        await page.wait_for_function("window.placedConstructionBodies.some(b => b.userData.growthStage)")

        # Try to find a tree and climb
        success = await page.evaluate("""
            () => {
                const tree = window.placedConstructionBodies.find(b => b.userData.growthStage);
                if (tree) {
                    // Move player to tree
                    window.playerBody.position.set(tree.position.x + 1.5, tree.position.y, tree.position.z);
                    // Aim at tree
                    window.camera.lookAt(tree.position.x, tree.position.y, tree.position.z);
                    // Sync player rotation
                    window.playerBody.quaternion.setFromEuler(0, window.camera.rotation.y, 0);
                    return true;
                }
                return false;
            }
        """)

        if success:
            print("Targeted a tree.")
            await asyncio.sleep(0.5)
            # Take screenshot before climbing
            await page.screenshot(path='/home/jules/verification/before_climbing.png')

            # Press P to climb
            await page.keyboard.press('p')
            await asyncio.sleep(0.5)

            # Check climbing state
            is_climbing = await page.evaluate("window.isClimbing")
            print(f"Is climbing: {is_climbing}")

            if is_climbing:
                await page.screenshot(path='/home/jules/verification/climbing_active.png')
                # Move up
                await page.keyboard.down('w')
                await asyncio.sleep(2)
                await page.keyboard.up('w')
                await page.screenshot(path='/home/jules/verification/climbing_high.png')
            else:
                print("Failed to start climbing. Checking if tree was in range.")
                dist = await page.evaluate("""
                    () => {
                        const tree = window.placedConstructionBodies.find(b => b.userData.growthStage);
                        const p = window.playerBody.position;
                        const t = tree.position;
                        return Math.sqrt((p.x-t.x)**2 + (p.y-t.y)**2 + (p.z-t.z)**2);
                    }
                """)
                print(f"Distance to tree: {dist}")

        # Try to find a coconut tree and check straightness
        coco_found = await page.evaluate("""
            () => {
                const coco = window.placedConstructionBodies.find(b => b.userData.treeType === 'coconut');
                if (coco) {
                    window.playerBody.position.set(coco.position.x + 5, 2, coco.position.z);
                    window.camera.lookAt(coco.position.x, 5, coco.position.z);
                    return true;
                }
                return false;
            }
        """)

        if coco_found:
            print("Found a coconut tree.")
            await asyncio.sleep(1)
            await page.screenshot(path='/home/jules/verification/straight_coconut.png')
        else:
            print("No coconut tree found.")

        server.terminate()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
