
from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:8000/index.htm")
            page.click("#startButton")
            page.wait_for_timeout(10000) # Increased timeout for loading

            # Open backpack to see all tools
            page.keyboard.press("B")
            page.wait_for_selector("#backpackModal.active")

            # Verify Hammer tooltip
            hammer_slot = page.locator('#backpackSlotsContainer .slot:has(img[src*="martelo"])')
            hammer_slot.hover()
            tooltip_text = page.locator("#tooltip").inner_text()
            print(f"Hammer tooltip: {tooltip_text}")
            assert "Martelo" in tooltip_text
            assert "Sem uso" in tooltip_text

            # Verify Pickaxe tooltip
            pickaxe_slot = page.locator('#backpackSlotsContainer .slot:has(img[src*="whnsbw.svg"])')
            pickaxe_slot.hover()
            tooltip_text = page.locator("#tooltip").inner_text()
            print(f"Pickaxe tooltip: {tooltip_text}")
            assert "Picareta" in tooltip_text
            assert "Pedra e Terra" in tooltip_text

            # Close the backpack to check the axe in the belt
            page.keyboard.press("B")
            page.wait_for_selector("#backpackModal:not(.active)")

            # Hover over the axe slot in the belt
            axe_slot_belt = page.locator('#inventoryBelt #belt-slot-1')
            axe_slot_belt.hover()
            tooltip_text = page.locator("#tooltip").inner_text()
            print(f"Axe tooltip: {tooltip_text}")
            assert "Machado" in tooltip_text
            assert "Especialidade: Madeira" in tooltip_text

            page.screenshot(path="verification.png")
            print("Verification successful: Tooltips are correct.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            page.screenshot(path="error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
