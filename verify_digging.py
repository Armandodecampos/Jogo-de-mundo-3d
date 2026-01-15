
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Set up a listener for the success message from our test function
        success_message_found = asyncio.Event()
        def handle_console(msg):
            print(f"Console: {msg.text}") # Print all messages for debugging
            if "JULES_TEST: SUCCESS" in msg.text:
                success_message_found.set()

        page.on("console", handle_console)

        try:
            await page.goto("http://localhost:8000/index.htm", timeout=60000)
            await page.locator("#startButton").click()

            # Wait for the world to be ready by listening for the specific console message
            print("Waiting for world to load...")
            async with page.expect_console_message(
                lambda msg: "All resources loaded, world is ready." in msg.text,
                timeout=30000
            ):
                pass # The context manager handles the waiting
            print("World is ready.")

            # Run the injected test function
            await page.evaluate("window.JULES_TEST_digging()")

            # Wait for the success message event to be set, with a timeout
            print("Waiting for test success message...")
            await asyncio.wait_for(success_message_found.wait(), timeout=10)

            print("Verification successful: Destruction was automatically cancelled.")

        except (asyncio.TimeoutError, Exception) as e:
            print(f"An error occurred during verification: {e}")
            await page.screenshot(path="dig_verification_error.png")
            raise # Re-raise the exception to fail the step

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
