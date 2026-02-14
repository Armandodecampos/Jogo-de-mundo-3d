import asyncio
from playwright.async_api import async_playwright
import time

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('http://localhost:8080/index.htm')

        # Click Jogar
        await page.click('button:has-text("Jogar")')

        # Wait for world ready
        await page.wait_for_function('window.isWorldReady === true')

        # Try to find or force spawn
        teleport_script = """
        () => {
            let appleTree = window.placedConstructionMeshes.find(m => m.userData.physicsBody && m.userData.physicsBody.userData.treeType === 'apple' && m.userData.physicsBody.userData.growthStage === 'arvore_adulta');
            if (!appleTree) {
                console.log("No apple tree found, spawning one...");
                const x = 5, z = 5;
                const h = window.getSurfaceHeight(x, z);
                window.createPlaceableBlock({x: x, y: h, z: z}, null, 'semente_macieira', 'arvore_adulta');
                appleTree = window.placedConstructionMeshes.find(m => m.userData.physicsBody && m.userData.physicsBody.userData.treeType === 'apple' && m.userData.physicsBody.userData.growthStage === 'arvore_adulta');
            }

            if (appleTree) {
                const pos = appleTree.position;
                window.playerBody.position.set(pos.x - 5, pos.y + 2, pos.z);
                window.playerBody.velocity.set(0,0,0);
                window.camera.lookAt(pos.x, pos.y + 2, pos.z);
                return {found: true, x: pos.x, z: pos.z};
            }
            return {found: false};
        }
        """

        result = await page.evaluate(teleport_script)
        print(f"Teleport result: {result}")

        if result['found']:
            time.sleep(2) # wait for render and physics to settle
            await page.screenshot(path='/home/jules/verification/apple_tree_found.png')

            # Check for apples
            apple_check = """
            () => {
                const appleTree = window.placedConstructionMeshes.find(m => m.userData.physicsBody && m.userData.physicsBody.userData.treeType === 'apple' && m.userData.physicsBody.userData.growthStage === 'arvore_adulta');
                let appleCount = 0;
                if (appleTree) {
                    appleTree.children.forEach(child => {
                        if (child.userData.isApple) appleCount++;
                    });
                }
                return appleCount;
            }
            """
            count = await page.evaluate(apple_check)
            print(f"Apples found on tree: {count}")

        await browser.close()

asyncio.run(run())
