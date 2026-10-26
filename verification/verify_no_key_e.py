import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8080/index.htm")
    page.wait_for_timeout(1000)

    # Launch game directly
    page.wait_for_function("typeof window.executeFinalGameLaunch === 'function'", timeout=60000)
    page.evaluate("window.executeFinalGameLaunch();")
    page.wait_for_function("window.isWorldReady === true", timeout=60000)
    page.wait_for_timeout(1000)

    # Setup world state: mock pointerLockElement, spawn box, update raycast targets, aim camera at box
    page.evaluate('''() => {
        Object.defineProperty(document, 'pointerLockElement', {
            get: () => window.renderer.domElement,
            configurable: true
        });

        const playerPos = window.playerBody ? window.playerBody.position : { x: 0, y: 1, z: 0 };
        const boxPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z - 2);
        const boxBody = window.createBox(boxPos, null);

        window.updateRaycastTargets();

        const box = window.collectibleBoxes.find(b => b.body === boxBody);
        window.raycaster.intersectObjects = () => [{
            distance: 1.5,
            object: box.mesh
        }];

        window.animate();
    }''')
    page.wait_for_timeout(1000)

    # Take screenshot of the HUD hint showing '(Botão Esq.) Abrir / (G) Guardar'
    page.screenshot(path="/home/jules/verification/screenshots/box_interaction_hint.png")
    page.wait_for_timeout(1000)

    # Try pressing key 'e'
    page.evaluate('''() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    }''')
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
