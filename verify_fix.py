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
        # Use existing objects or create a new one correctly using the exposed CANNON
        page.evaluate("""
            const CANNON = window.CANNON;
            const dummyShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            const dummyBody = new CANNON.Body({ mass: 1, shape: dummyShape });
            window.world.addBody(dummyBody);
            // Position it right at the player's feet
            dummyBody.position.set(window.playerBody.position.x, window.playerBody.position.y, window.playerBody.position.z);

            // Simulate grabObject() logic for collision filtering
            dummyBody.collisionFilterGroup = 0;
            dummyBody.collisionFilterMask = 0;
            dummyBody.type = CANNON.Body.KINEMATIC;
            dummyBody.collisionResponse = false;
            window.pickedObjectBody = dummyBody;
        """)

        is_grabbing = page.evaluate("window.pickedObjectBody !== null")
        print(f"Is grabbing (simulated): {is_grabbing}")

        # Try to move with 'W'
        print("Pressing 'W' while grabbing...")
        page.keyboard.down("w")
        time.sleep(2)
        page.keyboard.up("w")

        final_pos = page.evaluate("window.playerBody.position.clone()")
        print(f"Final player position: {final_pos}")

        # Take a screenshot
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/verify_movement.png")

        dist_moved = abs(initial_pos['z'] - final_pos['z'])
        print(f"Distance moved: {dist_moved}")

        if dist_moved > 5.0:
            print("VERIFICATION SUCCESS: Player moved freely while grabbing!")
        else:
            print("VERIFICATION FAILURE: Player did not move enough.")

        browser.close()

if __name__ == "__main__":
    run()
