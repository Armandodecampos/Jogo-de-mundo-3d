from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(500)
    page.click("#startButton")
    page.wait_for_function("window.isWorldReady === true", timeout=15000)
    page.wait_for_timeout(500)

    page.evaluate("""() => {
        // Create a floor on ground
        window.createPlaceableBlock(new window.THREE.Vector3(-1, 0.04, -5), null, 'piso');
        // Create a door over the floor
        window.createPlaceableBlock(new window.THREE.Vector3(-1, 1.2, -5), null, 'porta');
        // Create a standalone door on ground without floor
        window.createPlaceableBlock(new window.THREE.Vector3(1, 1.2, -5), null, 'porta');

        // Orient camera towards the doors
        if (window.camera) {
            window.camera.position.set(0, 0.5, -1.5);
            window.camera.lookAt(0, 0.5, -5);
        }
    }""")

    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/door_floor_gap.png")
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
