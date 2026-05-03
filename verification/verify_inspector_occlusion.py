import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('http://localhost:8080/index.htm')
        await page.click('#startButton')
        await page.wait_for_function('window.isWorldReady === true')

        # Enable Inspector
        await page.keyboard.press('i')

        # Setup: No clouds
        await page.evaluate('''() => {
            window.clouds.forEach(c => window.scene.remove(c.mesh));
            window.clouds.length = 0;
        }''')

        # Test 1: Point at Sun
        await page.evaluate('''() => {
            window.world.time = 0; // Noon
            window.playerBody.position.set(0, 10, 0);
            window.camera.lookAt(window.sunMesh.position);
            window.camera.updateMatrixWorld();
        }''')
        await asyncio.sleep(1)
        text_sun = await page.locator('#inspectorDisplay').text_content()
        print(f"Direct look at Sun (no clouds): {text_sun}")

        # Test 2: Place a block in front of the sun and look at it
        await page.evaluate('''() => {
            // Find direction to sun
            const dir = new window.THREE.Vector3().subVectors(window.sunMesh.position, window.camera.position).normalize();
            // Place block 3 meters away in that direction
            const pos = dir.clone().multiplyScalar(3).add(window.camera.position);
            window.createPlaceableBlock(pos, new window.THREE.Quaternion(), 'cob');
            window.camera.lookAt(pos);
            window.camera.updateMatrixWorld();
        }''')
        await asyncio.sleep(1)
        text_occluded = await page.locator('#inspectorDisplay').text_content()
        print(f"Occluded look at Sun (looking at block): {text_occluded}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
