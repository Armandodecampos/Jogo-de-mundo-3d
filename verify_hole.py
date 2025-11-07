from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            # Go to the page
            page.goto("http://localhost:8000")

            # Click the start button and wait for the world to be ready
            page.click("#startButton")
            page.wait_for_function("() => window.isWorldReady")

            # Evaluate in page context to perform the action
            page.evaluate("""() => {
                // Ensure the shovel is selected (it's in slot 0 by default)
                window.selectedSlotIndex = 0;
                window.updateBeltDisplay();

                // Point camera slightly downwards to aim at the ground
                window.camera.rotation.x = -Math.PI / 4;

                // Simulate a short click to dig a hole
                window.createMound();
            }""")

            # Wait a moment for the hole to be created and rendered
            page.wait_for_timeout(1000)

            # Take a screenshot to verify the result
            page.screenshot(path="hole_placement_test.png")
            print("Screenshot 'hole_placement_test.png' taken.")

            # Programmatic check: verify that a visual mound has been created
            mound_count = page.evaluate("() => window.visualMounds.length")
            if mound_count > 0:
                print(f"Verification successful: {mound_count} mound(s) created.")
            else:
                print("Verification failed: No mounds were created.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
