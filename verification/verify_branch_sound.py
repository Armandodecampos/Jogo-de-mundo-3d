from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(500)

    page.click("#startButton")
    page.wait_for_function("window.isWorldReady === true", timeout=30000)
    page.wait_for_timeout(1000)

    page.evaluate("""
        () => {
            const adultBody = window.createPlaceableBlock(
                new window.THREE.Vector3(0, 0, 5),
                null,
                'muda_arvore',
                'arvore_adulta'
            );
            window.playBranchBreakSound();
            window.addItemToInventory(window.backpackItems, { name: 'galho', quantity: 1 });
        }
    """)
    page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/branch_break_sound.png")
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
