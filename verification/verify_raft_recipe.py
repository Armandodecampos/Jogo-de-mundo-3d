import os
from playwright.sync_api import sync_playwright

os.makedirs('/home/jules/verification/videos', exist_ok=True)
os.makedirs('/home/jules/verification/screenshots', exist_ok=True)

def run_cuj(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(500)

    page.evaluate("localStorage.clear()")
    page.click("#startButton")

    page.wait_for_function("window.isWorldReady === true", timeout=120000)
    page.wait_for_timeout(1000)

    # Open crafting menu
    page.evaluate("window.openCraftingMenu('initial')")
    page.wait_for_timeout(1000)

    # Scroll recipesContainer to bring Jangada into view
    page.evaluate("""() => {
        const container = document.getElementById('recipesContainer');
        if (container) {
            container.scrollTop = 250;
        }
    }""")
    page.wait_for_timeout(500)

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
