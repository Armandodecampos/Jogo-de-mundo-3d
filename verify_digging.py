
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for the specific console message
        test_result = None
        def handle_console(msg):
            nonlocal test_result
            if "JULES_TEST: currentMound.isMountain" in msg.text:
                test_result = msg.text

        page.on("console", handle_console)

        try:
            await page.goto("http://localhost:8000/index.htm")
            await page.locator("#startButton").click()
            await page.wait_for_function("window.isWorldReady === true", timeout=30000)
            print("World is ready.")

            # Run the injected test function
            await page.evaluate("window.JULES_TEST_digging()")

            # Wait a moment for the console message to be captured
            await page.wait_for_timeout(1000)

            # Verify the result from the console message
            print(f"Captured test result: {test_result}")
            if test_result is None:
                raise Exception("Verification failed: Did not capture test result from console.")
            if "true" not in test_result:
                raise Exception(f"Verification failed: Expected 'isMountain' to be true, but got: {test_result}")

            print("Verification successful: 'isMountain' flag is correctly set to true.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="dig_verification_error.png")
            raise

        finally:
            await browser.close()

asyncio.run(main())
