from playwright.sync_api import sync_playwright, expect
import pathlib
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

    try:
        file_path = f"file://{pathlib.Path.cwd()}/index.htm"
        page.goto(file_path, wait_until="load")

        page.locator("#startButton").click()
        expect(page.locator("#crosshair")).to_be_visible(timeout=30000)
        page.wait_for_timeout(2000) # wait for assets

        # Click canvas to get pointer lock
        page.locator("canvas").click()
        page.wait_for_timeout(500)

        # Select axe
        page.keyboard.press("e")
        page.wait_for_timeout(500)

        # Destroy the deposit (it should be right in front)
        page.mouse.down()
        page.wait_for_timeout(1600) # durability is 1.5s
        page.mouse.up()

        page.wait_for_timeout(500)

        # Screenshot 1: flattened dono
        page.screenshot(path="jules-scratch/verification/flattened_dono.png")

        # Wait for respawn
        print("Waiting 61 seconds for respawn...")
        time.sleep(61)

        # Screenshot 2: respawned dono
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
