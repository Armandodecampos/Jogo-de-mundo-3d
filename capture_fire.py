import asyncio
from playwright.async_api import async_playwright
import time
import os

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Use record_video_dir to capture the animation
        context = await browser.new_context(record_video_dir="videos/")
        page = await context.new_page()

        await page.goto("http://localhost:8080")
        await page.click("#startButton")
        await page.wait_for_function("window.isWorldReady === true")

        # Place a campfire and a torch close to each other
        await page.evaluate("""
            const pos1 = new window.THREE.Vector3(1, 0, -3);
            const pos2 = new window.THREE.Vector3(-1, 0, -3);
            window.createPlaceableBlock(pos1, new window.THREE.Quaternion(), 'fogueira');
            window.createPlaceableBlock(pos2, new window.THREE.Quaternion(), 'tocha');

            // Force camera to look at them
            window.camera.position.set(0, 1.6, 0);
            window.camera.lookAt(0, 0, -3);
        """)

        # Wait for some time to record the animation
        # Note: In headless mode without GPU, THREE.js might not render at full speed
        # or might need a force-render loop if requestAnimationFrame is throttled.
        # But our animate() is called via requestAnimationFrame.

        # To ensure it actually renders frames in headless, we might need to tick it manually
        # if the browser detects it's not visible, but Playwright keeps it active.

        # Let's wait 10 seconds
        time.sleep(10)

        await page.screenshot(path="screenshots/fire_verification.png")
        await context.close()
        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("videos"): os.makedirs("videos")
    if not os.path.exists("screenshots"): os.makedirs("screenshots")
    asyncio.run(capture())
