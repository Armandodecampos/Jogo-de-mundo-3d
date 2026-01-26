
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Listen for all console events and print them
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    page.goto("http://localhost:8000/", wait_until="networkidle")

    # Start the game
    page.click("#startButton")
    page.wait_for_timeout(5000) # Wait for the world to load

    # Open the backpack directly
    page.evaluate("() => window.openBackpack()")

    # Wait for the modal to be visible and take screenshot
    backpack_modal = page.locator("#backpackModal")
    expect(backpack_modal).to_be_visible()
    page.screenshot(path="verification_initial.png")

    # Add an item to the backpack
    page.evaluate("() => { window.addItemToInventory(window.backpackItems, { name: 'cob', quantity: 1 }); window.updateBackpackDisplay(); }")

    # Wait for the image to load
    page.wait_for_timeout(1000)

    # Expect a new slot to be created and take screenshot
    second_slot = page.locator("#backpack-slot-1")
    expect(second_slot).to_be_visible()
    page.screenshot(path="verification_after_add.png")

    # Remove the item and update logic
    page.evaluate("() => { window.backpackItems[0] = null; window.updateBackpackLogic(); window.updateBackpackDisplay(); }")

    # Expect the second slot to be removed
    expect(second_slot).to_be_hidden()
    page.screenshot(path="verification_after_remove.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
