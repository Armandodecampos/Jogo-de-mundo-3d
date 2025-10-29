
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            await page.goto("http://localhost:8000")

            # Click the start button
            await page.locator("#startButton").click()

            # Wait for the game world to be ready
            await page.wait_for_function("() => window.stoneDeposits && window.stoneDeposits.length > 0", timeout=30000)

            # Add console logs to verify the alpha map is created
            alpha_map_exists = await page.evaluate("() => !!window.alphaMapTexture")
            if not alpha_map_exists:
                print("FAIL: alphaMapTexture not found on window object.")
            else:
                print("SUCCESS: alphaMapTexture found on window object.")

            # Dig a hole
            await page.evaluate("() => window.digHole({ point: { x: 0, y: 0, z: 0 } })")
            await asyncio.sleep(1) # Wait for visual update

            # Check if the alpha map was updated
            alpha_map_updated = await page.evaluate("() => window.alphaMapTexture.needsUpdate")
            if not alpha_map_updated:
                 print("FAIL: alphaMapTexture.needsUpdate is not true after digging.")
            else:
                 print("SUCCESS: alphaMapTexture.needsUpdate is true after digging.")

            await page.screenshot(path="jules-scratch/verification/screenshot.png")
            print("SUCCESS: Verification script completed and took a screenshot.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
