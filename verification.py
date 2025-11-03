
from playwright.sync_api import sync_playwright, expect
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

def run_verification():
    with sync_playwright() as p:
        try:
            logging.info("Launching browser...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Listen for all console events and log them
            page.on("console", lambda msg: logging.info(f"PAGE LOG: {msg.text}"))

            logging.info("Navigating to http://localhost:8000/index.htm")
            page.goto("http://localhost:8000/index.htm", timeout=120000)

            logging.info("Page loaded. Waiting for start button...")
            start_button = page.locator("#startButton")
            expect(start_button).to_be_visible(timeout=60000)

            logging.info("Start button is visible. Clicking...")
            start_button.click()

            logging.info("Start button clicked. Waiting for a fixed period to allow loading...")
            # Wait for a long time to see if anything loads, instead of waiting for a specific function
            page.wait_for_timeout(120000) # 2 minutes

            logging.info("Wait finished. Taking screenshot...")
            page.screenshot(path="verification/verification.png")
            logging.info("Screenshot taken successfully.")

        except Exception as e:
            logging.error(f"An error occurred: {e}")
            try:
                page.screenshot(path="verification/error_screenshot.png")
                logging.info("Error screenshot taken.")
            except Exception as se:
                logging.error(f"Could not take error screenshot: {se}")

        finally:
            if 'browser' in locals() and browser.is_connected():
                logging.info("Closing browser.")
                browser.close()

if __name__ == "__main__":
    run_verification()
