import asyncio
from playwright.async_api import async_playwright, TimeoutError

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        try:
            await page.goto("http://localhost:8000")

            # Click the start button
            await page.locator("#startButton").click()

            # Wait for the isWorldReady flag to be true
            await page.wait_for_function("window.isWorldReady", timeout=15000)
            print("World is ready!")

            # Equip the shovel
            # First, we need to add the shovel to the belt if it's not there
            await page.evaluate("""() => {
                if (!window.beltItems.some(item => item && item.name === 'pá')) {
                    const shovel = window.backpackItems.find(item => item && item.name === 'pá');
                    if (shovel) {
                        const shovelIndex = window.backpackItems.indexOf(shovel);
                        // Place it in the first slot (Q)
                        window.backpackItems[shovelIndex] = window.beltItems[0];
                        window.beltItems[0] = shovel;
                        window.updateBeltDisplay();
                        window.updateBackpackDisplay();
                    }
                }
                window.selectedSlotIndex = 0;
                window.updateBeltDisplay();
            }""")

            # Move the camera to look down
            await page.evaluate("""() => {
                window.camera.rotation.x = -Math.PI / 4;
            }""")

            # Wait a bit for the camera to update
            await page.wait_for_timeout(500)

            # Simulate a short click to dig a hole
            canvas = page.locator('canvas')
            box = await canvas.bounding_box()
            if box:
                await page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
                await page.mouse.down()
                await page.wait_for_timeout(100) # Short press
                await page.mouse.up()

            # Wait for the hole to be created
            await page.wait_for_timeout(1000)

            # Take a screenshot
            await page.screenshot(path="hole_verification.png")
            print("Screenshot taken successfully.")

        except TimeoutError:
            print("Timeout waiting for the world to load or an element to appear.")
        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
