import time
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/index.htm")

        page.click("#startButton")
        page.wait_for_function("window.isWorldReady === true")
        time.sleep(2)

        # Mock pointer lock for raycasting in animate()
        page.evaluate("Object.defineProperty(document, 'pointerLockElement', { get: () => window.renderer.domElement });")

        # 1. Beach Size
        # Increase render distance to see island from above
        page.evaluate("window.localStorage.setItem('renderDistance', 1000)")
        page.goto("http://localhost:8000/index.htm") # Reload to apply settings
        page.click("#startButton")
        page.wait_for_function("window.isWorldReady === true")
        page.evaluate("Object.defineProperty(document, 'pointerLockElement', { get: () => window.renderer.domElement });")

        page.evaluate("""
            window.playerBody.position.set(0, 200, 0);
            window.camera.position.set(0, 200, 0);
            window.camera.lookAt(0, 0, 0);
        """)
        time.sleep(1)
        page.screenshot(path="beach_topdown.png")

        # 2. Grass Collection
        cluster = page.evaluate("window.capimClusters[0]")
        if cluster:
            print(f"Testing grass collection at {cluster['position']}")
            page.evaluate(f"""
                window.playerBody.position.set({cluster['position']['x']}, {cluster['position']['y'] + 1}, {cluster['position']['z'] + 1});
                window.camera.position.set({cluster['position']['x']}, {cluster['position']['y'] + 1}, {cluster['position']['z'] + 1});
                window.camera.lookAt({cluster['position']['x']}, {cluster['position']['y']}, {cluster['position']['z']});
                window.playerBody.velocity.set(0,0,0);
            """)
            time.sleep(1.0)

            page.evaluate("window.startDestruction()")
            is_dest = page.evaluate("window.isDestroying")
            print(f"Is destroying grass? {is_dest}")

            if is_dest:
                start_wait = time.time()
                while time.time() - start_wait < 10:
                    is_still_dest = page.evaluate("window.isDestroying")
                    if not is_still_dest:
                        break
                    time.sleep(0.5)

                final_capim = page.evaluate("window.backpackItems.filter(i => i && i.name === 'capim').reduce((a, b) => a + b.quantity, 0)")
                print(f"Final Capim: {final_capim}")

        # 3. Protected Area
        print(f"Testing protection at (280, 280)")
        page.evaluate("""
            window.playerBody.position.set(275, 5, 275);
            window.camera.position.set(275, 5, 275);
            window.camera.lookAt(280, -10, 280);
            window.playerBody.velocity.set(0,0,0);
        """)
        time.sleep(0.5)
        page.evaluate("window.startDestruction()")
        is_dest_prot = page.evaluate("window.isDestroying")
        print(f"Is destroying in protected area? {is_dest_prot}")

        page.screenshot(path="verification.png")
        browser.close()

if __name__ == "__main__":
    verify()
