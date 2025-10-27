
import asyncio
from playwright.async_api import async_playwright, expect
import math

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8000")

        # Click the start button
        await page.evaluate("document.getElementById('startButton').click()")

        # Wait for the game world to be ready
        await page.wait_for_function("() => window.isWorldReady === true")

        # Wait for physics to settle
        await asyncio.sleep(2)

        # Programmatically equip the shovel
        await page.evaluate("""() => {
            const shovelIndex = window.backpackItems.findIndex(item => item && item.name === 'pá');
            const shovelItem = window.backpackItems[shovelIndex];
            window.backpackItems[shovelIndex] = null;
            window.beltItems[0] = shovelItem;
            window.selectedSlotIndex = 0;
            window.updateBeltDisplay();
            window.updateBackpackDisplay();
        }""")

        # Aim the camera down and update its matrix
        await page.evaluate(f"""() => {{
            window.camera.rotation.x = -{math.pi / 4};
            window.camera.updateMatrixWorld();
        }}""")

        # Directly call the digHole function
        await page.evaluate("window.digHole()")

        # Wait a moment for the visual update
        await asyncio.sleep(1)

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/physical_hole_verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
