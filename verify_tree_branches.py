import os
import glob
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(1000)

    # Start game
    page.click("#startButton")
    page.wait_for_function("() => window.isWorldReady === true", timeout=30000)
    page.wait_for_timeout(1000)

    # Position camera to look at a tree
    page.evaluate('''() => {
        const treeBody = window.placedConstructionBodies.find(b => b.userData && b.userData.branches);
        if (treeBody) {
            window.camera.position.set(treeBody.position.x + 3, treeBody.position.y + 2, treeBody.position.z + 3);
            window.camera.lookAt(treeBody.position.x, treeBody.position.y + 1, treeBody.position.z);
        }
    }''')
    page.wait_for_timeout(1000)

    # Take screenshot
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    page.screenshot(path="/home/jules/verification/screenshots/tree_branches.png")
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
