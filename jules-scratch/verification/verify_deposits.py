
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        page.goto("http://localhost:8000")
        page.click("#startButton")
        page.wait_for_timeout(5000)
        page.screenshot(path="jules-scratch/verification/deposits_fixed.png")
        browser.close()

run()
