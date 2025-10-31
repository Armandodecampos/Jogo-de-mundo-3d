
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Start the game
        page.click("#startButton")

        # Wait for the game to load
        page.wait_for_function("() => window.isWorldReady")

        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

run()
