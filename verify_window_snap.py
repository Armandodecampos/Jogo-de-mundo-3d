import os
import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(500)

    # Click start button to launch game
    page.evaluate("() => { const b = document.getElementById('startButton'); if (b) b.click(); }")

    # Wait for game world to be ready
    page.wait_for_function("() => window.isWorldReady === true", timeout=15000)
    page.wait_for_timeout(1000)

    # Take screenshot of the running game HUD / view
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
