from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(2000)
    page.click("#startButton")
    page.wait_for_timeout(2000)
    page.evaluate("window.world.time = 150")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/night_sky.png")
    page.evaluate("window.world.time = 80")
    page.evaluate("window.playerBody.position.z = 590")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/before_boundary.png")
    page.evaluate("window.playerBody.position.z = -590")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/after_boundary.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/videos")
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
