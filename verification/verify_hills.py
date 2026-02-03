from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Access the local server
        page.goto("http://localhost:8000/index.htm")

        # Click start button
        page.click("#startButton")

        # Wait for world to be ready
        time.sleep(5)

        # Capture screenshot
        page.screenshot(path="verification/final_hills_view.png")

        browser.close()

if __name__ == "__main__":
    run()
