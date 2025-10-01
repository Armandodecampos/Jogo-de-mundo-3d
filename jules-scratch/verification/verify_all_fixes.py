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
        # IMPORTANT: Wait for UI to be ready before interacting with it.
        page.wait_for_timeout(1000)

        # --- SETUP INVENTORY (BEFORE POINTER LOCK) ---
        # Open backpack
        page.keyboard.press('b')
        page.wait_for_timeout(1000) # Wait for modal animation

        # Drag a box from the backpack to the primary hand slot
        page.locator("#backpack-slot-8").drag_to(page.locator("#belt-slot-0"))
        page.wait_for_timeout(500)

        # Close the backpack
        page.keyboard.press('b')
        page.wait_for_timeout(500)

        # Now, lock the pointer and start the in-game tests
        canvas.click()
        page.wait_for_timeout(2000)

        # --- 1. Verify Placing a Box ---
        # The box is in our hand, so a simple click should place it.
        page.mouse.click(640, 360)
        page.wait_for_timeout(1000)
        page.screenshot(path="jules-scratch/verification/01_box_placed.png")
        # After placing, the hand slot (0) should be empty.

        # --- 2. Verify Collecting a Box (Shift + Click) ---
        # With an empty hand, Shift + Click should collect the box we just placed.
        page.keyboard.down('Shift')
        page.mouse.click(640, 360)
        page.keyboard.up('Shift')
        page.wait_for_timeout(1000)
        page.screenshot(path="jules-scratch/verification/02_box_collected_with_shift.png")

        # --- 3. Verify Grabbing a Box (Short Click) ---
        # We should have an empty hand now after placing and collecting.
        # Let's move towards the initial set of boxes to grab one of them.
        page.keyboard.down('w')
        time.sleep(1.5)
        page.keyboard.up('w')
        page.wait_for_timeout(500)

        # Short click to grab.
        page.mouse.click(640, 360)
        page.wait_for_timeout(500)
        # Move it to prove it's grabbed
        page.mouse.move(500, 400, steps=10)
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/03_box_grabbed_short_click.png")
        # Drop it
        page.mouse.click(640, 360) # Short click again to drop
        page.wait_for_timeout(500)

        # --- 4. Verify Grabbing a Box (Long Press) ---
        # The box should be right in front of us still.
        # Grab with a long press
        page.mouse.down()
        time.sleep(0.3) # Hold for >250ms
        page.mouse.move(700, 400, steps=10)
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/04_box_grabbed_long_press.png")
        page.mouse.up()

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)