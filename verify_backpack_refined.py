
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Expose functions for testing
    page.add_init_script("window.exposeFunctions = true;")

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

    # Add two items to the backpack
    page.evaluate("() => { window.addItemToInventory(window.backpackItems, { name: 'cob', quantity: 1 }); window.updateBackpackLogic(); window.updateBackpackDisplay(); }")
    page.evaluate("() => { window.addItemToInventory(window.backpackItems, { name: 'pedra', quantity: 1 }); window.updateBackpackLogic(); window.updateBackpackDisplay(); }")

    # Expect three slots to be created and take screenshot
    third_slot = page.locator("#backpack-slot-2")
    expect(third_slot).to_be_visible()
    page.screenshot(path="verification_after_add_multiple.png")

    # Remove the middle item and update logic
    page.evaluate("() => { window.backpackItems[1] = null; window.updateBackpackLogic(); window.updateBackpackDisplay(); }")

    # Expect the third slot to be hidden
    expect(third_slot).to_be_hidden()
    page.screenshot(path="verification_after_remove_middle.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
