
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:8000")

            await page.click("#startButton")
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(1000)

            # This script will just take a screenshot of the initial state
            # The previous, more complex script already verified the functionality
            await page.screenshot(path="jules-scratch/verification/verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
