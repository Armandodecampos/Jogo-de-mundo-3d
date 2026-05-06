
import asyncio
from playwright.async_api import async_playwright
import time

async def verify_campfire():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        await page.goto('http://localhost:8080')
        await page.click('#startButton')
        await page.wait_for_function('window.isWorldReady === true')

        # 1. Place a campfire
        print("Placing campfire...")
        await page.evaluate('''() => {
            // Select slot 3 (index 2) where campfires were added to crate10 in our verification earlier,
            // but for simplicity, let's just add it to the player's inventory directly for testing.
            window.addItemToInventory(window.beltItems, { name: 'fogueira', quantity: 1 });
            window.selectedSlotIndex = 1; // Assuming slot 2
            window.updateBeltDisplay();
        }''')

        # Give it a moment to sync
        await asyncio.sleep(1)

        # Simulate clicking to place the campfire
        # We need to aim at the ground. (0, 0, 0) is usually safe if player is at (0, y, 0)
        # But we'll just force the placement for visual verification if raycast is tricky in headless
        await page.evaluate('''() => {
            const pos = new window.THREE.Vector3(0, window.getSurfaceHeight(0, 2), 2);
            window.createPlaceableBlock(pos, new window.THREE.Quaternion(), 'fogueira');
        }''')

        await asyncio.sleep(1)

        # 2. Verify it's in activeCampfires and has light/group
        campfire_status = await page.evaluate('''() => {
            const cf = window.activeCampfires[0];
            if (!cf) return "No campfire in activeCampfires";
            return {
                type: cf.userData.type,
                hasLight: !!cf.userData.fireLight,
                hasGroup: !!cf.userData.fireGroup,
                intensity: cf.userData.fireLight ? cf.userData.fireLight.intensity : 0
            };
        }''')
        print(f"Campfire status: {campfire_status}")

        # 3. Take a screenshot
        await page.screenshot(path='screenshots/campfire_verification.png')
        print("Screenshot saved to screenshots/campfire_verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_campfire())
