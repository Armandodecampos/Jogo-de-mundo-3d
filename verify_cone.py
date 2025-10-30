
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

            # Wait for the game world to be ready, with a longer timeout
            print("Waiting for game world to be ready...")
            await page.wait_for_function("() => window.isWorldReady === true", timeout=30000)
            print("Game world is ready.")

            # Check the physics shape of the first dirt deposit
            is_cone = await page.evaluate("""
                () => {
                    if (!window.dirtDeposits || window.dirtDeposits.length === 0) {
                        console.error('dirtDeposits not found or is empty.');
                        return false;
                    }
                    const deposit = window.dirtDeposits[0];
                    if (!deposit || !deposit.body || !deposit.body.shapes || deposit.body.shapes.length === 0) {
                        console.error('First deposit or its physics body/shape is invalid.');
                        return false;
                    }
                    const shape = deposit.body.shapes[0];
                    // A cone is a cylinder with one radius being very small
                    const isTopSmall = shape.radiusTop < 0.1;
                    const isBottomLarge = shape.radiusBottom > 0.1;
                    console.log(`Shape radii: Top=${shape.radiusTop}, Bottom=${shape.radiusBottom}`);
                    return isTopSmall && isBottomLarge;
                }
            """)

            if is_cone:
                print("SUCCESS: The dirt deposit's physics body is a cone.")
            else:
                print("FAILURE: The dirt deposit's physics body is NOT a cone.")

        except Exception as e:
            print(f"An error occurred: {e}")
            print("Dumping page content for debugging:")
            content = await page.content()
            print(content)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
