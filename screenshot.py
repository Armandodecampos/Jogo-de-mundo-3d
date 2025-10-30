
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            await page.goto("http://localhost:8000/index.htm", wait_until="networkidle")
            print("Successfully navigated to the page.")

            await page.click("#startButton")
            print("Clicked the start button.")

            # Wait for a fixed amount of time for the world to load
            print("Waiting for 15 seconds...")
            await page.wait_for_timeout(15000)

            # Take a screenshot for visual verification
            await page.screenshot(path="cone_screenshot.png")
            print("Screenshot 'cone_screenshot.png' taken.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
