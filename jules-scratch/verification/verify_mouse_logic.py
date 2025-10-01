from playwright.sync_api import sync_playwright, expect
import time
import os

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()

    try:
        # Navigate to the game file
        absolute_path = os.path.abspath("./index.htm")
        page.goto(f"file://{absolute_path}")

        # Start the game
        page.locator("#startButton").click()
        canvas = page.locator("canvas")
        expect(canvas).to_be_visible()
        canvas.click()
        page.wait_for_timeout(2000)

        # --- 1. Walk to a box ---
        page.keyboard.down('w')
        time.sleep(1.5)
        page.keyboard.up('w')
        page.wait_for_timeout(500)

        # --- 2. Verify Grabbing a Box (Short Click) ---
        page.mouse.click(640, 360) # Short click to grab
        page.wait_for_timeout(100) # Wait a moment for the grab to register
        page.mouse.move(500, 400, steps=10) # Move it to prove it's grabbed
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/01_grab_on_short_click.png")

        # --- 3. Drop the box ---
        page.mouse.click(640, 360) # Short click again to drop
        page.wait_for_timeout(500)

        # --- 4. Verify Collecting a Box (Long Press) ---
        page.mouse.down()
        time.sleep(0.3) # Hold for >250ms to trigger collection
        page.mouse.up()
        page.wait_for_timeout(1000) # Wait for collection logic
        page.screenshot(path="jules-scratch/verification/02_collect_on_long_press.png")

        # --- 5. Verify Inventory ---
        page.keyboard.press('b') # Open backpack
        page.wait_for_timeout(1000) # Wait for modal animation
        page.screenshot(path="jules-scratch/verification/03_inventory_after_collect.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)