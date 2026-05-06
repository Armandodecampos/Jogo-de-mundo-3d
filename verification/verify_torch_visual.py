import asyncio
from playwright.async_api import async_playwright
import os

async def verify_torch():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        # Load the game
        print("Loading page...")
        await page.goto('http://localhost:8080/index.htm')
        await page.click('#startButton')

        # Wait for world ready
        await page.wait_for_function('window.isWorldReady === true', timeout=60000)

        # Add torch and select it
        await page.evaluate('''() => {
            window.addItemToInventory(window.beltItems, { name: 'tocha', quantity: 10 });
            const index = window.beltItems.findIndex(item => item && item.name === "tocha");
            if (index !== -1) {
                window.selectedSlotIndex = index;
            }
            window.updateUI();
        }''')

        await asyncio.sleep(2)

        # Capture screenshot of held torch
        os.makedirs('screenshots', exist_ok=True)
        await page.screenshot(path='screenshots/held_torch_verification.png')
        print("Captured screenshots/held_torch_verification.png")

        # Check rotation in JS
        rotation_x = await page.evaluate('''() => {
            return window.heldTorchGroup.children[0].rotation.x;
        }''')
        print(f"Held torch stick rotation.x: {rotation_x}")

        # Check fire material
        emissive = await page.evaluate('''() => {
            const fireMat = window.heldTorchGroup.children[1].children[0].material;
            return {
                emissive: fireMat.emissive.getHex(),
                emissiveIntensity: fireMat.emissiveIntensity
            };
        }''')
        print(f"Held torch fire emissive: {hex(emissive['emissive'])}, intensity: {emissive['emissiveIntensity']}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_torch())
