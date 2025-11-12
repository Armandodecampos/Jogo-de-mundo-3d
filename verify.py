
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Click the start button
        page.locator("#startButton").click()

        # Wait for the world to be ready
        page.wait_for_function("() => window.isWorldReady")

        # Use the shovel to dig a hole
        page.evaluate("() => { window.createMound(); }")

        # Take a screenshot
        page.screenshot(path="screenshot.png")

        browser.close()

run()
