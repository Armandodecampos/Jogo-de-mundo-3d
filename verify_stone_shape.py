
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto('http://localhost:8000')

        # Expose a function to Playwright to know when init is done
        await page.expose_function("onInitFinished", asyncio.Future())

        # Directly call the startGame function
        await page.evaluate("startGame()")

        # Wait for the stoneDeposits array to be populated
        await page.wait_for_function('() => window.stoneDeposits && window.stoneDeposits.length > 0')

        # Get the shape types of the stone deposits
        shape_types = await page.evaluate('() => window.stoneDeposits.map(d => d.body.shapes[0].type)')

        # In Cannon-es, a sphere has a type of 1
        is_sphere = all(t == 1 for t in shape_types)

        print(f"All stone deposits are spheres: {is_sphere}")
        print(f"Shape types: {shape_types}")

        await browser.close()

asyncio.run(main())
