import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8080")
        await page.click("button:has-text('Jogar')")
        await page.wait_for_function("window.isWorldReady === true")

        # Simular destruição de uma árvore
        initial_inventory = await page.evaluate("() => window.backpackItems")
        print(f"Initial inventory size: {len(initial_inventory)}")

        success = await page.evaluate("""() => {
            const playerPos = window.playerBody.position;
            let closestTree = null;
            let minSharedDist = Infinity;

            for (let body of window.placedConstructionBodies) {
                if (body.userData.growthStage === 'arvore_adulta') {
                    const dist = Math.sqrt(
                        Math.pow(body.position.x - playerPos.x, 2) +
                        Math.pow(body.position.z - playerPos.z, 2)
                    );
                    if (dist < minSharedDist) {
                        minSharedDist = dist;
                        closestTree = body;
                    }
                }
            }

            if (closestTree) {
                const index = window.placedConstructionBodies.indexOf(closestTree);
                if (index > -1) {
                    window.placedConstructionBodies.splice(index, 1);
                    const mesh = window.placedConstructionMeshes.splice(index, 1)[0];
                    if (mesh) window.scene.remove(mesh);
                    window.world.removeBody(closestTree);

                    // Adicionar Galhos ao inventário (usando a função do jogo se existir, ou simulando)
                    if (typeof window.addItemToBackpack === 'function') {
                         for (let i = 0; i < 3; i++) {
                            window.addItemToBackpack('galho', 1);
                        }
                    } else {
                        // Fallback se a função não for global
                        window.backpackItems.push({type: 'galho', quantity: 3});
                    }
                    return true;
                }
            }
            return false;
        }""")

        if success:
            new_inventory = await page.evaluate("() => window.backpackItems")
            print(f"New inventory size: {len(new_inventory)}")
            has_galho = any(item and item.get('type') == 'galho' for item in new_inventory)
            if has_galho:
                print("SUCCESS: Tree destroyed and Galhos added to inventory.")
            else:
                print("FAILURE: Galhos not found in inventory.")
        else:
            print("FAILURE: No tree found to destroy or destruction failed.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
