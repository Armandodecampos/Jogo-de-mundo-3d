
from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:8080")

            # Click the start button to initialize the game
            page.locator("#startButton").click()

            # Wait for the isWorldReady flag to be true
            page.wait_for_function("() => window.isWorldReady", timeout=30000)

            # Take a screenshot
            page.screenshot(path="verification_fixed.png")

            print("Verification successful, screenshot saved as verification_fixed.png")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
