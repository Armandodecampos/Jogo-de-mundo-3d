
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for all console events and print them
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        print("Navigating to the page...")
        await page.goto("http://localhost:8000")

        print("Clicking the start button...")
        await page.click("#startButton")

        # Wait for a short period to see if any errors occur after start
        await asyncio.sleep(5)

        print("Debug script finished.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
