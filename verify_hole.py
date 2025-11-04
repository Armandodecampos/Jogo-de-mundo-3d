
from playwright.sync_api import sync_playwright

def verify_hole_texture(page):
    # Navigate to the game
    page.goto("http://localhost:8000")

    # Start the game
    page.click("#startButton")

    # Wait for the world to be ready
    page.wait_for_function("() => window.isWorldReady")

    # Expose a function to the window to select a slot
    page.evaluate("window.setSelectedSlot = (index) => { beltItems[index] = { name: 'pá', quantity: 1 }; updateBeltDisplay(); }")

    # Equip the shovel (pá)
    page.evaluate("setSelectedSlot(0)")

    # Simulate a short mouse click to dig
    canvas = page.locator('canvas')
    box = canvas.bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    page.mouse.down()
    page.wait_for_timeout(100) # Short press
    page.mouse.up()

    # Wait a bit for the hole to appear
    page.wait_for_timeout(500)

    # Take a screenshot
    page.screenshot(path="verify_hole.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        verify_hole_texture(page)
    finally:
        browser.close()
