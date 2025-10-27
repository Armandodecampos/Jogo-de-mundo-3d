
from playwright.sync_api import sync_playwright

def verify_digging_mechanic():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Start the game
        page.click("#startButton")

        # Wait for the game to load
        page.wait_for_function("window.isWorldReady")

        # Equip the shovel
        page.evaluate("() => { beltItems[0] = { name: 'pá', quantity: 1 }; updateBeltDisplay(); }")

        # Dig a hole
        page.evaluate("() => digHole()")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    verify_digging_mechanic()
