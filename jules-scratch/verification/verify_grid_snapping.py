import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Get the absolute path to the HTML file
        file_path = os.path.abspath('index.htm')
        await page.goto(f'file://{file_path}')

        # 1. Start the game
        await page.get_by_role("button", name="Jogar").click()

        # Click the canvas to ensure pointer lock
        await page.click('canvas', force=True)
        await page.wait_for_timeout(2000)

        # 2. Open backpack, move item, and close backpack
        await page.keyboard.press('b')
        await page.wait_for_timeout(500) # wait for backpack to open

        # The cob item is the 4th item added to the backpack, so its index is 3
        # The axe is in the second belt slot, index 1
        await page.drag_and_drop('#backpack-slot-3', '#belt-slot-1')
        await page.wait_for_timeout(500) # wait for drag to complete

        await page.keyboard.press('b')
        await page.wait_for_timeout(500) # wait for backpack to close

        # 3. Select the cob item from the belt
        await page.keyboard.press('e')
        await page.wait_for_timeout(500)

        # 4. Aim and place blocks
        canvas_selector = "canvas"

        # Aim down at the ground
        await page.evaluate(f"""
            const canvas = document.querySelector('{canvas_selector}');
            canvas.dispatchEvent(new MouseEvent('mousemove', {{ movementX: 0, movementY: 500, bubbles: true }}));
        """)
        await page.wait_for_timeout(500)

        # Place the first block
        await page.evaluate(f"""
            const canvas = document.querySelector('{canvas_selector}');
            canvas.dispatchEvent(new MouseEvent('mousedown', {{ button: 0, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, bubbles: true }}));
            canvas.dispatchEvent(new MouseEvent('mouseup', {{ button: 0, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, bubbles: true }}));
        """)
        await page.wait_for_timeout(1000) # Increased wait time

        # Move a bit to the side
        await page.evaluate(f"""
            const canvas = document.querySelector('{canvas_selector}');
            canvas.dispatchEvent(new MouseEvent('mousemove', {{ movementX: 200, movementY: 0, bubbles: true }}));
        """)
        await page.wait_for_timeout(500)

        # Place the second block
        await page.evaluate(f"""
            const canvas = document.querySelector('{canvas_selector}');
            canvas.dispatchEvent(new MouseEvent('mousedown', {{ button: 0, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, bubbles: true }}));
            canvas.dispatchEvent(new MouseEvent('mouseup', {{ button: 0, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, bubbles: true }}));
        """)
        await page.wait_for_timeout(1500) # Increased wait time

        # 5. Take screenshot
        screenshot_path = 'jules-scratch/verification/verification.png'
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())