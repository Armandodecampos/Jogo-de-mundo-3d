import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:8080/index.htm')
        await page.click('#startButton')

        # Wait for world to be ready
        await page.wait_for_function('() => window.isWorldReady === true', timeout=60000)

        # Take a screenshot before digging
        await page.screenshot(path='before_digging.png')

        # Perform digging via JS
        await page.evaluate('''() => {
            const intersect = {
              point: new window.THREE.Vector3(0, 0.8, 0),
              face: { normal: new window.THREE.Vector3(0, 1, 0) },
              object: window.islandMeshes[4].mesh
            };
            window.createMound(intersect, false);
            // Simulate the progress of digging
            window.isAttemptingToDestroy = true;
            // Force a mound height update for immediate visual check
            window.mounds[0].height = -1.0;
            window.updateIslandGeometry(window.mounds[0]);
        }''')

        await asyncio.sleep(2) # Wait for potential animations

        # Take a screenshot after digging
        await page.screenshot(path='after_digging.png')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
