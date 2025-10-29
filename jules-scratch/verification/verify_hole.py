
from playwright.sync_api import sync_playwright, TimeoutError

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        try:
            page.goto("http://localhost:8000")

            page.evaluate("() => document.getElementById('startButton').click()")

            # Replace wait_for_function with a fixed timeout
            page.wait_for_timeout(10000) # Wait 10 seconds

            # Equip shovel
            page.evaluate("() => { window.beltItems[1] = { name: 'pá', quantity: 1 }; window.updateBeltDisplay(); }")
            page.keyboard.press("E")

            # Dig a hole
            page.mouse.down()
            page.mouse.up()

            page.wait_for_timeout(500)

            page.screenshot(path="jules-scratch/verification/hole_verification.png")
            print("Screenshot taken.")

        except TimeoutError:
            print("Test failed due to timeout.")
            page.screenshot(path="jules-scratch/verification/timeout_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
