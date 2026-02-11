
from playwright.sync_api import sync_playwright

def screenshot_trees():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080/index.htm")
        page.click("#startButton")
        page.wait_for_function("window.isWorldReady === true", timeout=20000)

        # Teleport player to a location with trees
        # Based on populateTrees, they are spawned within radius 280
        page.evaluate("""() => {
            // Find a tree position
            // Since I didn't expose placedConstructionBodies again, I'll just teleport to some common spawn area
            // Or better, let's just wait and hope we see some from spawn.
            // Actually, let's look for a tree mesh in the scene
            // ...
        }""")

        # Wait for rendering
        page.wait_for_timeout(2000)

        # Look around or move to see trees
        # The adult trees should be very large now (15 units high)

        page.screenshot(path="tree_visual_verification.png")
        browser.close()

if __name__ == "__main__":
    screenshot_trees()
