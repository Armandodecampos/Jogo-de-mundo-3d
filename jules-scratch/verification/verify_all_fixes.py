import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        file_path = os.path.abspath('index.htm')
        await page.goto(f'file://{file_path}')

        # 1. Start game and acquire pointer lock
        await page.click('#startButton')
        await page.wait_for_timeout(1000)
        await page.click('canvas')
        await page.wait_for_timeout(500)

        # 2. Test held object wrapping
        # Grab the nearest box (long press)
        await page.mouse.move(640, 360) # Center of screen
        await page.mouse.down()
        await page.wait_for_timeout(300) # Hold for 300ms
        await page.mouse.up()
        await page.wait_for_timeout(500)

        # Move right to cross the world border
        for _ in range(20):
            await page.keyboard.press('d')
            await page.wait_for_timeout(200)
        await page.keyboard.up('d')
        await page.wait_for_timeout(500)

        # Take a screenshot to verify the box is still held correctly
        await page.screenshot(path="jules-scratch/verification/held_object_test.png")

        # Drop the box (short click)
        await page.mouse.click(640, 360)
        await page.wait_for_timeout(500)

        # 3. Test tree growth and stone floor mirroring
        # Open backpack
        await page.keyboard.press('b')
        await page.wait_for_timeout(500)

        # Drag tree sapling to the belt
        await page.drag_and_drop('#backpack-slot-5', '#belt-slot-1')
        await page.wait_for_timeout(500)

        # Close backpack and re-acquire pointer lock
        await page.keyboard.press('b')
        await page.wait_for_timeout(500)
        await page.click('canvas', force=True)
        await page.wait_for_timeout(500)

        # Select the sapling and place it
        await page.keyboard.press('e')
        await page.wait_for_timeout(500)
        await page.click('canvas', position={'x': 550, 'y': 400}, force=True)
        await page.wait_for_timeout(500)

        # Open backpack to get texture applicator
        await page.keyboard.press('b')
        await page.wait_for_timeout(500)

        # Drag texture applicator to the belt
        await page.drag_and_drop('#backpack-slot-2', '#belt-slot-1')
        await page.wait_for_timeout(500)

        # Close backpack and re-acquire pointer lock
        await page.keyboard.press('b')
        await page.wait_for_timeout(500)
        await page.click('canvas', force=True)
        await page.wait_for_timeout(500)

        # Select the texture applicator and apply texture
        await page.keyboard.press('e')
        await page.wait_for_timeout(500)
        await page.click('canvas', position={'x': 700, 'y': 450}, force=True)
        await page.wait_for_timeout(500)

        # Wait for the tree to grow
        await page.wait_for_timeout(22000)

        # Final screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())