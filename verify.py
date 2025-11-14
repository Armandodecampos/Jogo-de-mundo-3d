
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Start the game
        page.click("#startButton")

        # Wait for the world to be ready
        page.wait_for_function("() => window.isWorldReady")

        # Equip the shovel
        page.evaluate("() => { window.beltItems[0] = { name: 'pá', quantity: 1 }; window.updateBeltDisplay(); }")
        page.keyboard.press("q")


        # Create a mound
        page.evaluate("() => { window.createMound(); }")

        # Take a screenshot
        page.screenshot(path="mound_texture_test.png")

        browser.close()

run()
