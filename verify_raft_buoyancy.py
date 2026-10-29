import os
import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(1000)

    # Clear localStorage and start game
    page.evaluate("localStorage.clear()")
    page.click("#startButton")

    # Wait for world ready
    page.wait_for_function("window.isWorldReady === true", timeout=60000)
    page.wait_for_timeout(1000)

    # Setup pointerLock, create raft in open water and board it
    page.evaluate("""
        Object.defineProperty(document, 'pointerLockElement', {
            get: () => window.renderer.domElement,
            configurable: true
        });

        // Find sea coordinate
        let seaX = 250, seaZ = 100;
        window.createRaft(new CANNON.Vec3(seaX, -8, seaZ));
        const raft = window.raftBodies[window.raftBodies.length - 1];

        // Board raft
        window.isDrivingRaft = true;
        window.currentRaftBody = raft;
    """)

    page.wait_for_timeout(2000)

    # Take screenshot showing player on raft floating on sea
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
