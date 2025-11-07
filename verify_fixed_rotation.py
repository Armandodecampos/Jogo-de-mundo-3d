
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

            await page.goto("http://localhost:8000")

            print("Clicking start button...")
            await page.evaluate("document.getElementById('startButton').click()")

            print("Waiting for world to be ready...")
            await page.wait_for_function("window.isWorldReady === true", timeout=60000)
            print("World is ready.")

            target_rotation_y = 1.5  # A non-zero rotation
            print(f"Setting player rotation to {target_rotation_y} on Y-axis...")
            await page.evaluate(f"""() => {{
                window.playerBody.quaternion.setFromEuler(0, {target_rotation_y}, 0);
                window.camera.rotation.y = {target_rotation_y};
                window.camera.updateMatrixWorld(); // Force update
            }}""")

            print("Calling createMound() directly...")
            await page.evaluate("() => { window.createMound(); }")

            print("Waiting for the hole to be created...")
            await page.wait_for_function("window.visualMounds && window.visualMounds.length > 0", timeout=10000)
            print("Hole created.")

            print("Verifying hole rotation is neutral...")
            hole_quaternion = await page.evaluate("() => ({ x: window.visualMounds[0].quaternion.x, y: window.visualMounds[0].quaternion.y, z: window.visualMounds[0].quaternion.z, w: window.visualMounds[0].quaternion.w })")

            is_identity = (
                abs(hole_quaternion['x']) < 1e-6 and
                abs(hole_quaternion['y']) < 1e-6 and
                abs(hole_quaternion['z']) < 1e-6 and
                abs(hole_quaternion['w'] - 1.0) < 1e-6
            )

            if not is_identity:
                raise Exception(f"Hole rotation verification failed! Quaternion is not neutral: {hole_quaternion}")

            print("Hole rotation verified successfully (is neutral).")

            await asyncio.sleep(1)

            print("Taking screenshot...")
            await page.screenshot(path="verification_screenshot.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
