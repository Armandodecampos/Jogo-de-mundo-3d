
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto('http://localhost:8000')
        await page.click('#startButton')

        # Wait for the stoneDeposits array to be populated
        await page.wait_for_function('window.stoneDeposits && window.stoneDeposits.length > 0')

        # Get the stoneDeposits array
        stone_deposits = await page.evaluate('window.stoneDeposits')

        # Programmatic verification
        all_on_island = True
        island_radius_top = 600  # The value from the game's code
        for deposit in stone_deposits:
            distance_from_center = (deposit['x']**2 + deposit['z']**2)**0.5
            if distance_from_center > island_radius_top:
                all_on_island = False
                break

        if all_on_island:
            print("Verification successful: All stone deposits are on the island.")
        else:
            print("Verification failed: Some stone deposits are outside the island.")

        await browser.close()

asyncio.run(main())
