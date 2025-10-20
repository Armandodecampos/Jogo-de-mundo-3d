
import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the local HTML file
    page.goto("file:///app/index.htm", wait_until="load")

    # Click the start button
    page.locator("#startButton").click()

    # Wait for the game to be ready by checking for the crosshair
    expect(page.locator("#crosshair")).to_be_visible(timeout=15000)

    # Use evaluate to dispatch a KeyboardEvent for pressing "e"
    page.evaluate("""() => {
        document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'e'}));
    }""")

    # Position the mouse over the center of the canvas (where the crosshair is)
    page.mouse.move(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)

    # Simulate a long press to destroy the stone deposit
    page.mouse.down()
    page.wait_for_timeout(2000)  # Hold for 2 seconds
    page.mouse.up()

    # Wait for the "dono" to respawn
    page.wait_for_timeout(65000) # 65 seconds to be safe

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
