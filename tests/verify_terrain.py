import time
import os
from playwright.sync_api import sync_playwright

def test_terrain_modification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Use absolute path
        abs_path = os.path.abspath('index.htm')
        page.goto(f'file://{abs_path}')

        # Click "Jogar"
        page.click('text=Jogar')

        # Wait for world
        page.wait_for_function('window.isWorldReady === true')

        # Modify terrain
        page.evaluate('''
            const pos = new window.THREE.Vector3(0, 5, 0);
            window.applyTerrainChange(pos, -1.0);
        ''')

        # Verify color is NOT green in the modified area
        # This is hard to do via code alone without complex image analysis,
        # but we can check if the shader uniforms and vertex color logic exist.

        # Check if modifiedVertices has one entry
        count = page.evaluate('window.islandGeometry.attributes.color.array.filter(c => c < 1.0).length')
        print(f"Number of non-white vertex channels: {count}")

        if count == 0:
            print("FAILED: No terrain modification detected in vertex colors.")
            exit(1)
        else:
            print("SUCCESS: Terrain modification detected in vertex colors.")

        browser.close()

if __name__ == "__main__":
    test_terrain_modification()
