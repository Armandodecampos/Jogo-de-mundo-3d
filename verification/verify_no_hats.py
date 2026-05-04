import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('http://localhost:8080/index.htm')
        await page.click('#startButton')
        await page.wait_for_function('window.isWorldReady === true')

        # Enable Inspector (optional but helpful)
        await page.keyboard.press('i')

        # Teleport and dig
        await page.evaluate('''() => {
            window.playerBody.position.set(5, 10, 5);
            // Simulate looking down at the ground
            window.camera.rotation.set(-Math.PI / 2.5, 0, 0);
            window.camera.updateMatrixWorld();
        }''')

        # Perform a few dig actions
        # Left click simulates digging
        for _ in range(5):
            await page.mouse.down()
            await asyncio.sleep(1.0) # Wait for progress bar
            await page.mouse.up()
            await asyncio.sleep(0.5)

        await page.screenshot(path='screenshots/digging_no_hats.png')
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
