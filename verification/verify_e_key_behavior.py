import os
from playwright.sync_api import sync_playwright

def test_e_key_behavior(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(1000)

    # Click Novo Jogo
    page.click('#startButton')
    page.wait_for_function("window.isWorldReady === true", timeout=60000)
    page.wait_for_timeout(1000)

    # Setup pointerLock mock
    page.evaluate('''() => {
        Object.defineProperty(document, 'pointerLockElement', {
            get: () => window.renderer.domElement,
            configurable: true
        });
    }''')

    # Test 1: Aiming at ground/air - pressing 'E' does NOTHING
    page.evaluate('''() => {
        window.raycaster.intersectObjects = () => [];
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    }''')
    page.wait_for_timeout(500)

    chestOptionsDisplay = page.evaluate('''() => {
        const el = document.getElementById('chestOptionsMenu');
        return el && el.style.display !== 'none' && !el.classList.contains('hidden');
    }''')
    print(f"Test 1 (Aiming at air - press E): options menu open? {chestOptionsDisplay} (Expected: False)")
    assert chestOptionsDisplay == False, "Options menu opened when aiming at air!"

    # Test 2: Aiming at a Bed - pressing 'E' does NOT open sleep modal
    page.evaluate('''() => {
        const playerPos = window.playerBody ? window.playerBody.position : { x: 0, y: 1, z: 0 };
        const bedMesh = new THREE.Mesh();
        const bedBody = {
            userData: { type: window.bedItemName, isBed: true }
        };
        bedMesh.userData = { physicsBody: bedBody };

        window.raycaster.intersectObjects = () => [{
            distance: 1.5,
            object: bedMesh
        }];

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    }''')
    page.wait_for_timeout(500)

    sleepModalVisible = page.evaluate('''() => {
        const el = document.getElementById('sleepModal');
        return el && el.style.display !== 'none' && !el.classList.contains('hidden');
    }''')
    print(f"Test 2 (Aiming at bed - press E): sleep modal open? {sleepModalVisible} (Expected: False)")
    assert sleepModalVisible == False, "Sleep modal opened when pressing E on bed!"

    # Test 3: Aiming at a Door - pressing 'E' does NOT toggle door
    page.evaluate('''() => {
        window.doorToggledCount = 0;
        const origToggle = window.toggleDoor;
        window.toggleDoor = function(body) {
            window.doorToggledCount++;
            return origToggle ? origToggle.apply(this, arguments) : null;
        };

        const doorMesh = new THREE.Mesh();
        const doorBody = {
            userData: { type: window.doorItemName, isOpen: false }
        };
        doorMesh.userData = { physicsBody: doorBody };

        window.raycaster.intersectObjects = () => [{
            distance: 1.5,
            object: doorMesh
        }];

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    }''')
    page.wait_for_timeout(500)

    doorToggled = page.evaluate('() => window.doorToggledCount')
    print(f"Test 3 (Aiming at door - press E): door toggled count? {doorToggled} (Expected: 0)")
    assert doorToggled == 0, "Door was toggled when pressing E!"

    # Test 4: Aiming at a Chest - pressing 'E' OPENS options menu
    page.evaluate('''() => {
        const playerPos = window.playerBody ? window.playerBody.position : { x: 0, y: 1, z: 0 };
        const boxPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z - 2);
        const boxBody = window.createBox(boxPos, null);
        window.updateRaycastTargets();

        const box = window.collectibleBoxes.find(b => b.body === boxBody);
        window.raycaster.intersectObjects = () => [{
            distance: 1.5,
            object: box.mesh
        }];

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    }''')
    page.wait_for_timeout(500)

    chestOptionsDisplay = page.evaluate('''() => {
        const el = document.getElementById('chestOptionsMenu');
        return el && el.style.display !== 'none' && !el.classList.contains('hidden');
    }''')
    print(f"Test 4 (Aiming at chest - press E): options menu open? {chestOptionsDisplay} (Expected: True)")
    assert chestOptionsDisplay == True, "Chest options menu did NOT open when pressing E on chest!"

    # Take screenshot of the chest options modal
    page.screenshot(path="/home/jules/verification/screenshots/e_key_chest_options.png")

    # Test 5: Pressing 'E' while chest options menu is open CLOSES it
    page.evaluate('''() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    }''')
    page.wait_for_timeout(500)

    chestOptionsDisplay = page.evaluate('''() => {
        const el = document.getElementById('chestOptionsMenu');
        return el && el.style.display !== 'none' && !el.classList.contains('hidden');
    }''')
    print(f"Test 5 (Press E while chest options menu is open): options menu open? {chestOptionsDisplay} (Expected: False)")
    assert chestOptionsDisplay == False, "Chest options menu did NOT close when pressing E!"

    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_e_key_behavior(page)
        finally:
            context.close()
            browser.close()
