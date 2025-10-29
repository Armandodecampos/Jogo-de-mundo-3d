import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Listen for console messages and print them to the agent's output
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        # Navigate to the local server
        await page.goto("http://localhost:8000")

        # Click the start button
        await page.locator("#startButton").click()

        try:
            # Wait for the game world to be ready by polling a condition
            await page.wait_for_function("() => window.stoneDeposits && window.stoneDeposits.length > 0", timeout=30000)

            # Move the mouse to the center of the screen to ensure the player is looking forward
            viewport_size = page.viewport_size
            if viewport_size:
                await page.mouse.move(viewport_size['width'] / 2, viewport_size['height'] / 2)

            # Wait a moment for the player to be settled
            await page.wait_for_timeout(1000)

            # Call the digHole function exposed on the window object
            await page.evaluate("() => window.digHole()")

            # Wait for the visual changes to render
            await page.wait_for_timeout(2000)

            # Take a screenshot on success
            await page.screenshot(path="jules-scratch/verification/hole-verification.png")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            # Take a screenshot on error to see the final state of the page
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
            # Re-raise the exception to ensure the script exits with an error code
            raise
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
