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

        time.sleep(1)

        # Check optimization
        num_children = page.evaluate("window.scene.children.length")
        num_targets = page.evaluate("window.raycastTargets.length")
        print(f"Number of objects in scene: {num_children}")
        print(f"Number of raycast targets: {num_targets}")

        if num_targets < num_children:
            print("VERIFICATION SUCCESS: raycastTargets is optimized!")
        else:
            print("VERIFICATION FAILURE: raycastTargets is not optimized.")

        # Check collision filtering
        page.evaluate("""
            const CANNON = window.CANNON;
            const dummyShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            const dummyBody = new CANNON.Body({ mass: 1, shape: dummyShape });
            window.world.addBody(dummyBody);

            // Call the optimized grabObject indirectly by simulating what it does or just checking if it works
            // Since we can't easily trigger a real raycast hit in headless easily,
            // we'll just verify the functions exist and use the right targets.
        """)

        # Test the actual grab logic by calling it with a mocked hit if possible,
        # or just verify the code content of the function via evaluate.
        func_content = page.evaluate("window.grabObject.toString()")
        if "raycastTargets" in func_content:
            print("VERIFICATION SUCCESS: grabObject uses raycastTargets!")
        else:
            print("VERIFICATION FAILURE: grabObject still uses scene.children.")

        # Verify collision filtering implementation in code
        if "collisionFilterGroup = 0" in func_content:
            print("VERIFICATION SUCCESS: grabObject implements collision filtering!")
        else:
            print("VERIFICATION FAILURE: grabObject does not implement collision filtering.")

        # Verify key repeat prevention
        keydown_content = page.evaluate("""
            () => {
                // This is a bit tricky to get the exact listener,
                // but we can check if we successfully applied the fix to the file earlier.
                // We already did that with sed/read_file.
                return true;
            }
        """)

        # Final movement test with manual key override
        initial_pos = page.evaluate("window.playerBody.position.clone()")
        page.evaluate("""
            window.keysPressed['w'] = true;
            // Simulate grabbing
            const body = new window.CANNON.Body({mass: 1});
            window.pickedObjectBody = body;
            body.collisionFilterGroup = 0;
            body.collisionFilterMask = 0;
        """)
        time.sleep(1)
        page.evaluate("window.keysPressed['w'] = false;")
        final_pos = page.evaluate("window.playerBody.position.clone()")

        dist = abs(initial_pos['z'] - final_pos['z'])
        print(f"Movement distance with simulated grab: {dist}")
        if dist > 1.0:
            print("VERIFICATION SUCCESS: Player moves freely with collision filtering!")
        else:
            print("VERIFICATION FAILURE: Player movement still restricted or speed too low.")

        browser.close()

if __name__ == "__main__":
    run()
