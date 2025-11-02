
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            await page.goto("http://localhost:8080")

            # Click the start button
            await page.evaluate('document.getElementById("startButton").click()')

            # Wait for the game world to be ready
            await page.wait_for_function('window.isWorldReady === true', timeout=30000)

            # Equip the shovel by adding it to a belt slot and selecting it
            await page.evaluate('''() => {
                const shovel = { name: 'pá', quantity: 1 };
                window.beltItems[0] = shovel; // Place shovel in the primary slot
                window.selectedSlotIndex = 0;
                window.updateBeltDisplay();
            }''')

            # Click on the canvas to ensure focus for pointer lock
            await page.locator('canvas').click()

            # Wait a moment for pointer lock to engage and for the player to be settled.
            await asyncio.sleep(2)

            # Simulate a short mouse click (mousedown followed by mouseup) on the canvas to dig
            # This needs to be done via evaluate because pointer lock prevents direct mouse simulation
            await page.evaluate('''() => {
                const canvas = document.querySelector('canvas');
                const downEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    clientX: window.innerWidth / 2,
                    clientY: window.innerHeight / 2,
                    button: 0
                });
                const upEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    clientX: window.innerWidth / 2,
                    clientY: window.innerHeight / 2,
                    button: 0
                });
                canvas.dispatchEvent(downEvent);
                setTimeout(() => canvas.dispatchEvent(upEvent), 100); // Short delay for a click
            }''')

            # Wait for the hole to be dug
            await asyncio.sleep(1)

            # Take a screenshot
            await page.screenshot(path="hole_verification_transparent.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"An error occurred: {e}")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
