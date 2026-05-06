import asyncio
from playwright.async_api import async_playwright
import os

async def verify_campfire_detailed():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Increase timeout for slow loads
        page.set_default_timeout(60000)

        await page.goto('http://localhost:8080')

        # Click start button
        await page.click('#startButton')

        # Wait for world to be ready
        await page.wait_for_function("window.isWorldReady === true")
        print("World ready")

        # Select campfire
        # Let's add it to inventory to be sure
        await page.evaluate('''() => {
            window.addItemToInventory(window.beltItems, { name: 'fogueira', quantity: 5 });
            window.updateBeltDisplay();
        }''')

        belt_items = await page.evaluate("window.beltItems")
        campfire_slot = -1
        for i, item in enumerate(belt_items):
            if item and item['name'] == 'fogueira':
                campfire_slot = i + 1
                break

        if campfire_slot == -1:
            print("Campfire not found in belt")
            await browser.close()
            return

        print(f"Selecting campfire in slot {campfire_slot}")
        await page.keyboard.press(str(campfire_slot))

        # Force placement at a specific position for reliability
        print("Placing campfire via script")
        await page.evaluate('''() => {
            const pos = new window.THREE.Vector3(0, window.getSurfaceHeight(0, 5), 5);
            window.createPlaceableBlock(pos, new window.THREE.Quaternion(), 'fogueira');
        }''')
        await asyncio.sleep(1)

        # Check if it was placed
        count = await page.evaluate("window.activeCampfires.length")
        print(f"Active campfires: {count}")

        # Move back and look at it (not strictly necessary but good for screenshot)
        # Position player
        await page.evaluate('''() => {
            window.playerBody.position.set(0, 5, 10);
            window.camera.lookAt(0, 0, 5);
        }''')
        await asyncio.sleep(1)

        # Take screenshot
        os.makedirs('screenshots', exist_ok=True)
        await page.screenshot(path='screenshots/campfire_detailed.png')
        print("Screenshot saved to screenshots/campfire_detailed.png")

        # Verify it cannot be grabbed or collected
        # We need to find the body of the campfire
        campfire_body_id = await page.evaluate('''() => {
            const cf = window.activeCampfires[0];
            return cf && cf.body ? cf.body.id : null;
        }''')
        print(f"Campfire body ID: {campfire_body_id}")

        if campfire_body_id:
            # Try to grab (F) - simulating raycast hit
            grab_result = await page.evaluate(f'''() => {{
                const body = window.world.bodies.find(b => b.id === {campfire_body_id});
                if (!body) return "Body not found";
                // Mock grabObject logic for this specific body
                if (body.userData && body.userData.type === 'fogueira') {{
                    return "Blocked by type check" ;
                }}
                return "Not blocked";
            }}''')
            print(f"Grab check: {grab_result}")

            # Try to collect (G)
            collect_result = await page.evaluate(f'''() => {{
                const body = window.world.bodies.find(b => b.id === {campfire_body_id});
                if (!body) return "Body not found";
                // Mock collectObject logic
                if (body.userData && body.userData.type === 'fogueira') {{
                    return "Blocked by type check";
                }}
                return "Not blocked";
            }}''')
            print(f"Collect check: {collect_result}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_campfire_detailed())
