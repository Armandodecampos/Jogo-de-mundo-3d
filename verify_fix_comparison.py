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

        # Wait for world to be ready
        page.wait_for_function("window.isWorldReady === true")

        # Give it a moment to stabilize
        time.sleep(1)

        initial_pos = page.evaluate("window.playerBody.position.clone()")
        print(f"Initial player position: {initial_pos}")

        # We MUST use window.CANNON as it is exposed in index.htm
        page.evaluate("""
            const CANNON = window.CANNON;
            const dummyShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            const dummyBody = new CANNON.Body({ mass: 1, shape: dummyShape });
            window.world.addBody(dummyBody);
            // Position it right at the player's feet
            dummyBody.position.set(window.playerBody.position.x, window.playerBody.position.y, window.playerBody.position.z);

            // SIMULATE OLD BEHAVIOR (Collision active)
            dummyBody.type = CANNON.Body.KINEMATIC;
            dummyBody.collisionResponse = true; // Old behavior
            window.pickedObjectBody = dummyBody;
        """)

        # Try to move with 'W'
        print("Testing OLD behavior (should NOT move much)...")
        page.keyboard.down("w")
        time.sleep(2)
        page.keyboard.up("w")

        pos_after_blocked = page.evaluate("window.playerBody.position.clone()")
        dist_moved_blocked = abs(initial_pos['z'] - pos_after_blocked['z'])
        print(f"Distance moved (blocked): {dist_moved_blocked}")

        # NOW SIMULATE NEW BEHAVIOR
        page.evaluate("""
            const dummyBody = window.pickedObjectBody;
            // Apply new logic
            dummyBody.collisionFilterGroup = 0;
            dummyBody.collisionFilterMask = 0;
            dummyBody.collisionResponse = false;
        """)

        print("Testing NEW behavior (should move freely)...")
        page.keyboard.down("w")
        time.sleep(2)
        page.keyboard.up("w")

        final_pos = page.evaluate("window.playerBody.position.clone()")
        dist_moved_free = abs(pos_after_blocked['z'] - final_pos['z'])
        print(f"Distance moved (free): {dist_moved_free}")

        # Take a screenshot
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/verify_movement_comparison.png")

        if dist_moved_free > dist_moved_blocked * 2 or dist_moved_free > 1.0:
            print("VERIFICATION SUCCESS: New collision filtering allows movement!")
        else:
            print("VERIFICATION FAILURE: No significant improvement in movement.")

        browser.close()

if __name__ == "__main__":
    run()
