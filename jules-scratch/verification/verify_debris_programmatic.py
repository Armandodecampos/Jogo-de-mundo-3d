
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for all console events and print them
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        page.set_default_timeout(60000)

        # Go to the page
        await page.goto("http://localhost:8000")

        # Start the game
        await page.click("#startButton")

        # Wait for deposits to be created
        await page.wait_for_function("() => window.stoneDeposits && window.stoneDeposits.length > 0 && window.dirtDeposits && window.dirtDeposits.length > 0")

        # Programmatically destroy the first stone deposit
        await page.evaluate("""() => {
            const deposit = window.stoneDeposits[0];
            if (deposit) {
                // Simulate the core logic of destruction
                window.createDebris(deposit);
                window.world.removeBody(deposit.body);
                deposit.domeMeshes.forEach(item => item.mesh.visible = false);
                deposit.flattened = true;
                deposit.regenerationTimer = 60;
            }
        }""")

        # Wait a moment for debris to be processed
        await asyncio.sleep(1)

        # Verify that debris objects have been created
        debris_count = await page.evaluate("() => window.debris.length")
        if debris_count > 0:
            print(f"Programmatic verification successful: {debris_count} debris pieces created.")
        else:
            raise Exception("Programmatic verification failed: No debris was created.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
