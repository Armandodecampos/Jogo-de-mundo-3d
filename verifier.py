
from playwright.sync_api import sync_playwright
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            # Go to the local server
            page.goto("http://localhost:8000")

            # Click the start button
            page.click("#startButton")

            # Wait for the world to be ready
            page.wait_for_function("() => window.isWorldReady", timeout=15000)
            print("World is ready.")

            # Set selected slot to pickaxe
            page.evaluate("() => { window.setSelectedSlotIndex(1); }")
            print("Selected pickaxe.")

            # Simulate mouse down to start mining the mountain
            page.evaluate("() => { document.dispatchEvent(new MouseEvent('mousedown', { button: 0 })); }")
            print("Mouse down initiated.")

            # Wait for a few seconds to observe the effect
            time.sleep(5)

            # Simulate mouse up to stop mining
            page.evaluate("() => { document.dispatchEvent(new MouseEvent('mouseup', { button: 0 })); }")
            print("Mouse up initiated.")

            # Take a screenshot
            screenshot_path = "verification_screenshot.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="error_screenshot.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
