
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console logs to help with debugging
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            await page.goto("http://localhost:8000")

            # Click the start button to initialize the game
            await page.click("#startButton", timeout=5000)

            # Wait for the game world to be ready
            await page.wait_for_function("() => window.stoneDeposits && window.stoneDeposits.length > 0", timeout=30000)

            # Programmatically destroy a stone deposit for verification
            await page.evaluate("""
                () => {
                    window.stoneDeposits = typeof stoneDeposits !== 'undefined' ? stoneDeposits : [];
                    if (window.stoneDeposits.length > 0) {
                        const deposit = window.stoneDeposits[0];
                        deposit.flattened = true;
                        deposit.regenerationTimer = 60; // Prevent it from regenerating immediately

                        if (deposit.body) {
                            world.removeBody(deposit.body);
                        }

                        const flattenedHeight = 0.2;
                        const flattenedGeometry = new THREE.CylinderGeometry(deposit.radius, deposit.radius, flattenedHeight, 16);
                        const flattenedMaterial = flattenedStoneDepositMaterial;
                        const flattenedMesh = new THREE.Mesh(flattenedGeometry, flattenedMaterial);
                        flattenedMesh.receiveShadow = true;

                        const flattenedShape = new CANNON.Cylinder(deposit.radius, deposit.radius, flattenedHeight, 16);
                        const flattenedBody = new CANNON.Body({
                            mass: 0,
                            type: CANNON.Body.STATIC,
                            shape: flattenedShape,
                            material: islandMaterial
                        });

                        const surfaceNormal = new CANNON.Vec3(0, 1, 0);
                        deposit.body.quaternion.vmult(surfaceNormal, surfaceNormal);
                        const offset = surfaceNormal.scale(0.01);
                        flattenedBody.position.copy(deposit.body.position).vadd(offset, flattenedBody.position);

                        flattenedBody.quaternion.copy(deposit.body.quaternion);
                        world.addBody(flattenedBody);
                        deposit.flattenedBody = flattenedBody;

                        for (let j = -Math.floor(numTiles / 2); j <= Math.floor(numTiles / 2); j++) {
                            for (let k = -Math.floor(numTiles / 2); k <= Math.floor(numTiles / 2); k++) {
                                const mesh = flattenedMesh.clone();
                                scene.add(mesh);
                                deposit.flattenedMeshes.push({ mesh: mesh, offsetX: j * worldSize, offsetZ: k * worldSize });
                            }
                        }
                    }
                }
            """)

            # Wait a moment for the scene to update
            await page.wait_for_timeout(1000)

            # Take a screenshot for visual confirmation
            await page.screenshot(path="jules-scratch/verification/flattened_deposit_verification.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
