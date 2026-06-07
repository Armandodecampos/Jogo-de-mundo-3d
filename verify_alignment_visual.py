from playwright.sync_api import sync_playwright
import time

def run_door_alignment_visual(page):
    print("Starting Door Alignment Visual Verification...")
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(2000)
    page.click("#startButton")
    page.wait_for_function("window.isWorldReady === true", timeout=180000)
    page.wait_for_timeout(2000)

    page.evaluate("""() => {
        window.camera.position.set(1, 1, 1);
        window.camera.lookAt(0, 0.4, 0);

        // Place a block at (0, 0.2, 0)
        window.createPlaceableBlock(new window.CANNON.Vec3(0, 0.2, 0), new window.CANNON.Quaternion(), window.woodenBlockItemName);

        // Place a door aligned with the edge of the block at (0.2, 0, 0.2)
        // hinge will be at 0.2, 0, 0.2
        const door = window.createPlaceableBlock(new window.CANNON.Vec3(0.2, 0, 0.2), new window.CANNON.Quaternion(), window.doorItemName);
        window.targetDoor = door;
    }""")
    page.wait_for_timeout(2000)

    page.screenshot(path="/home/jules/verification/screenshots/door_alignment_final.png")
    print("Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/videos")
        page = context.new_page()
        try:
            run_door_alignment_visual(page)
        finally:
            context.close()
            browser.close()
