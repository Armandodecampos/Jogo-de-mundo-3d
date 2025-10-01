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
        page.wait_for_timeout(1000)

        # --- Setup Inventory ---
        page.keyboard.press('b')
        page.wait_for_timeout(500)
        page.locator("#backpack-slot-8").drag_to(page.locator("#belt-slot-0")) # Box
        page.wait_for_timeout(500)
        page.keyboard.press('b')
        page.wait_for_timeout(500)

        # Lock pointer to start game actions
        canvas.click()
        page.wait_for_timeout(1000)

        # --- 1. Place a box near the edge ---
        # Move close to the edge of the world (e.g., positive Z)
        page.keyboard.down('s')
        time.sleep(3)
        page.keyboard.up('s')
        page.wait_for_timeout(500)

        # Place the box
        page.mouse.click(640, 360)
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/01_placed_object_at_edge.png")

        # --- 2. Move to the other side of the world ---
        # The world wraps around, so moving forward should take us to the other side
        page.keyboard.down('w')
        time.sleep(3)
        page.keyboard.up('w')
        page.wait_for_timeout(1000)

        # --- 3. Verify the object is visible from the other side ---
        page.screenshot(path="jules-scratch/verification/02_seamless_object_visible.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)