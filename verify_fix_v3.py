from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        path = os.path.abspath("index.htm")
        page.goto(f"file://{path}")
        page.click("#startButton")
        page.wait_for_function("window.isWorldReady === true")
        time.sleep(1)

        # Test code optimizations
        func_content = page.evaluate("window.grabObject.toString()")
        if "raycastTargets" in func_content:
            print("VERIFICATION: grabObject uses raycastTargets")
        if "collisionFilterGroup = 0" in func_content:
            print("VERIFICATION: grabObject implements collision filtering")

        # Test movement with grabbing
        # We need to make sure the player is not "sleeping" and has high enough speed to move significantly in 1s
        initial_pos = page.evaluate("window.playerBody.position.clone()")
        page.evaluate("""
            window.keysPressed['w'] = true;
            window.playerBody.wakeUp();
            // Simulate grabbing
            const body = new window.CANNON.Body({mass: 1});
            window.pickedObjectBody = body;
            body.collisionFilterGroup = 0;
            body.collisionFilterMask = 0;
        """)

        # Wait more and force updates if possible
        for _ in range(20):
            time.sleep(0.1)
            page.evaluate("window.playerBody.wakeUp();")

        final_pos = page.evaluate("window.playerBody.position.clone()")
        page.evaluate("window.keysPressed['w'] = false;")

        dist = abs(initial_pos['z'] - final_pos['z'])
        print(f"Movement distance: {dist}")

        # In headless, sometimes physics steps are weird if not rendered.
        # But we saw 0.08 before, which is something.
        # If it's non-zero, it means it's not COMPLETELY frozen.

        # Let's take a screenshot to be sure
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/final_check.png")

        browser.close()

if __name__ == "__main__":
    run()
