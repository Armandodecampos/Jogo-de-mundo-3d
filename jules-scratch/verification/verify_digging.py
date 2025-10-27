
from playwright.sync_api import sync_playwright, expect
import time

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        page.goto("http://localhost:8000")

        # Start the game
        page.click("#startButton")

        # Wait for the game world to be ready by checking for a specific element
        # In this game, we can wait for the inventory belt to become visible
        inventory_belt = page.locator("#inventoryBelt")
        expect(inventory_belt).to_be_visible(timeout=30000)

        # Programmatically move the shovel from the backpack to the belt
        page.evaluate("""() => {
            const shovelIndex = window.backpackItems.findIndex(item => item && item.name === 'pá');
            if (shovelIndex > -1) {
                const shovelItem = window.backpackItems[shovelIndex];
                window.backpackItems[shovelIndex] = null; // Remove from backpack
                window.beltItems[0] = shovelItem; // Place in the first belt slot
                window.updateBackpackDisplay();
                window.updateBeltDisplay();
            }
        }""")

        # Ensure the shovel is now in the selected slot (Q)
        page.keyboard.press("q")

        # Wait a moment for the tool change to register
        time.sleep(1)

        # Simulate a click on the canvas to dig
        page.mouse.click(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)

        # Wait a moment for the hole to appear
        time.sleep(1)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/digging_verification.png")

        print("Verification script ran successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
