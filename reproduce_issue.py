from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        path = os.path.abspath("index.htm")
        page.goto(f"file://{path}")

        # Click "Jogar"
        page.click("#startButton")

        # Wait for world to be ready (JS uses true, not True)
        page.wait_for_function("window.isWorldReady === true")

        # Give it a moment to stabilize
        time.sleep(1)

        initial_pos = page.evaluate("window.playerBody.position")
        print(f"Initial player position: {initial_pos}")

        # Look at the box. Spawns at (0, y, -10). Player at (0, y, 0).
        # We need to rotate the camera to look at the box.
        # Box is at 180 degrees from spawn (looking towards -Z)
        # Standard camera look is towards -Z.

        # Force grab by calling grabObject directly to be sure
        print("Grabbing object...")
        page.evaluate("window.camera.rotation.set(-0.5, 0, 0)") # Look down a bit
        page.evaluate("window.grabObject()")

        is_grabbing = page.evaluate("window.pickedObjectBody !== null")
        print(f"Is grabbing: {is_grabbing}")

        # Try to move with 'W'
        print("Pressing 'W' while grabbing...")
        page.keyboard.down("w")
        time.sleep(2) # Wait 2 seconds to see if position changes
        page.keyboard.up("w")

        final_pos = page.evaluate("window.playerBody.position")
        print(f"Final player position: {final_pos}")

        # Take a screenshot
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/reproduction.png")

        if abs(initial_pos['z'] - final_pos['z']) < 0.1:
            print("ISSUE REPRODUCED: Player did not move while grabbing!")
        else:
            print("ISSUE NOT REPRODUCED: Player moved.")

        browser.close()

if __name__ == "__main__":
    run()
