import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console events and print them
        page.on('console', lambda msg: print(f"Browser Console: {msg.text}"))

        # Get the absolute path to the index.htm file
        file_path = os.path.abspath('index.htm')
        await page.goto(f'file://{file_path}')

        # 1. Start the game
        await page.click('#startButton', timeout=5000)

        # 2. Wait for the game to load
        await page.wait_for_selector('#inventoryBelt', state='visible', timeout=10000)
        await asyncio.sleep(1) # Extra wait for physics to settle

        # 3. Take a screenshot at the start position
        print("Taking screenshot at start position...")
        await page.screenshot(path="jules-scratch/verification/verification_near_start.png")

        # 4. Teleport the player far away
        print("Teleporting player far away...")
        await page.evaluate("() => { playerBody.position.z -= 200; }")
        await asyncio.sleep(1) # Wait for the next animation frame to update visuals

        # 5. Take a screenshot to show objects have disappeared
        print("Taking screenshot from far away...")
        await page.screenshot(path="jules-scratch/verification/verification_far.png")

        # 6. Teleport the player back
        print("Teleporting player back...")
        await page.evaluate("() => { playerBody.position.z += 200; }")
        await asyncio.sleep(1) # Wait for the next animation frame to update visuals

        # 7. Take a final screenshot to show objects have reappeared
        print("Taking screenshot from near...")
        await page.screenshot(path="jules-scratch/verification/verification_near_end.png")

        await browser.close()
        print("Verification script finished successfully.")

if __name__ == '__main__':
    asyncio.run(main())