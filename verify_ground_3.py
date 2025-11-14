
from playwright.sync_api import sync_playwright
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:8000")

        # Wait for the start button and click it
        page.wait_for_selector("#startButton", timeout=30000)
        page.click("#startButton")

        # Wait for the world to be ready
        page.wait_for_function("() => window.isWorldReady", timeout=60000)

        # Take a screenshot to verify the ground is not transparent
        time.sleep(5)
        screenshot_path = "verification.png"
        page.screenshot(path=screenshot_path)

        browser.close()

        print(f"Verification screenshot saved to {screenshot_path}")

if __name__ == "__main__":
    run_verification()
