
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            await page.goto("http://localhost:8000")

            # Start game and wait for assets to load
            await page.evaluate("() => document.getElementById('startButton').click()")
            await asyncio.sleep(4)

            # Trigger the debug function to complete the destruction
            print("Calling debug function to force destruction completion...")
            result = await page.evaluate("() => window.debug_completeDestruction()")

            if not result:
                raise Exception("Debug function failed to run or find a deposit.")

            print(f"Result from debug function: {result}")

            # Verify the immediate results
            if not result.get("destructionComplete"):
                raise Exception("The 'destructionComplete' flag was not set to true.")

            if not result.get("depositFlattened"):
                raise Exception("The deposit was not marked as flattened.")

            print("SUCCESS: Programmatic verification confirms the destruction logic is correct.")

            # Take a screenshot for visual confirmation of the flattened state
            await page.screenshot(path="jules-scratch/verification/destruction_fix_verify.png")
            print("Screenshot saved to jules-scratch/verification/destruction_fix_verify.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            await page.screenshot(path="jules-scratch/verification/destruction_fix_FAIL.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
