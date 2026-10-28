import os
from playwright.sync_api import sync_playwright

def run_verification():
    os.makedirs('/home/jules/verification/videos', exist_ok=True)
    os.makedirs('/home/jules/verification/screenshots', exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir='/home/jules/verification/videos')
        page = context.new_page()

        try:
            page.goto('http://localhost:8080/index.htm')
            page.wait_for_timeout(1000)

            # Start game
            page.click('#startButton')
            page.wait_for_function('window.isWorldReady === true')
            page.wait_for_timeout(1000)

            # Open settings screen to verify slider min value
            page.evaluate("document.getElementById('settingsScreen').classList.add('active')")
            page.wait_for_timeout(1000)

            # Take screenshot of settings screen showing minimum render distance slider
            screenshot_path = '/home/jules/verification/screenshots/settings_render_distance.png'
            page.screenshot(path=screenshot_path)
            page.wait_for_timeout(1000)

        finally:
            context.close()
            browser.close()

if __name__ == '__main__':
    run_verification()
