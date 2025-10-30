
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        page.goto("http://localhost:8000")
        page.click("#startButton")
        page.wait_for_timeout(5000)

        # Programmatic check
        is_state_valid = page.evaluate("""() => {
            const camera = window.camera;
            const deposits = window.dirtDeposits;

            if (!camera || !deposits) {
                console.error('Debug variables not found on window object.');
                return false;
            }

            // Check camera position
            if (isNaN(camera.position.x) || isNaN(camera.position.y) || isNaN(camera.position.z)) {
                console.error('Camera position contains NaN values.');
                return false;
            }

            // Check if deposits array is populated
            if (deposits.length === 0) {
                console.error('dirtDeposits array is empty.');
                return false;
            }

            // Check properties of the first deposit
            const firstDeposit = deposits[0];
            if (!firstDeposit.body || isNaN(firstDeposit.body.position.x)) {
                console.error('First deposit has invalid body or position.');
                return false;
            }

            console.log('Programmatic check passed: Camera and deposits appear to be valid.');
            return true;
        }""")

        if is_state_valid:
            print("Verification script: Programmatic check PASSED.")
        else:
            print("Verification script: Programmatic check FAILED.")

        browser.close()

run()
