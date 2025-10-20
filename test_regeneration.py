import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console events
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            await page.goto(f"file://{os.getcwd()}/index.htm", wait_until="load")

            # Click the start button
            await page.locator("#startButton").click()

            # Wait for the game to load by checking for the crosshair
            await expect(page.locator("#crosshair")).to_be_visible(timeout=10000)

            # Wait for the game logic to be ready
            await page.wait_for_function('window.gameReady === true', timeout=10000)
            print("Game is ready.")

            # Lock the pointer
            await page.locator("canvas").click()

            # Give a brief moment for the game to stabilize after starting
            await page.wait_for_timeout(1000)

            # --- Test Logic ---

            # 1. Find the closest, non-flattened stone deposit
            closest_deposit_index = await page.evaluate('''() => {
                const playerPos = window.playerBody.position;
                let closestDist = Infinity;
                let closestIndex = -1;

                window.stoneDeposits.forEach((deposit, index) => {
                    if (!deposit.flattened) {
                        const depositPos = { x: deposit.x, y: 0, z: deposit.z };
                        const dx = playerPos.x - depositPos.x;
                        const dz = playerPos.z - depositPos.z;
                        const dist = Math.sqrt(dx*dx + dz*dz);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestIndex = index;
                        }
                    }
                });
                return closestIndex;
            }''')

            if closest_deposit_index == -1:
                raise Exception("No non-flattened stone deposits found to test.")

            print(f"Closest deposit index: {closest_deposit_index}")

            # 2. Move player in front of the deposit
            await page.evaluate(f'''(index) => {{
                const deposit = window.stoneDeposits[index];
                const depositPos = new CANNON.Vec3(deposit.x, window.playerBody.position.y, deposit.z);

                // Move player 2 units away from the deposit, facing it
                const direction = depositPos.vsub(window.playerBody.position);
                direction.normalize();
                const targetPos = depositPos.vsub(direction.scale(2));

                window.playerBody.position.set(targetPos.x, targetPos.y, targetPos.z);

                // Make the camera look at the deposit
                const lookAtPoint = new THREE.Vector3(deposit.x, window.playerBody.position.y, deposit.z);
                window.camera.lookAt(lookAtPoint);

            }}''', closest_deposit_index)

            print("Player moved in front of the deposit.")
            await page.wait_for_timeout(500) # Wait for physics to settle

            # 3. Simulate click to destroy
            print("Simulating click to destroy...")
            await page.mouse.down()
            await page.wait_for_timeout(100)
            await page.mouse.up()


            # 4. Verify destruction
            await expect(page.get_by_text(f"[TEST] Destroying deposit at")).to_be_visible(timeout=5000)

            is_flattened_after_destroy = await page.evaluate(f'(index) => window.stoneDeposits[index].flattened', closest_deposit_index)
            if not is_flattened_after_destroy:
                raise Exception("Deposit was not flattened after destruction.")
            print("SUCCESS: Deposit flattened.")

            # 5. Wait for regeneration
            print("Waiting for regeneration (61 seconds)...")
            await expect(page.get_by_text(f"[TEST] Regenerating deposit at")).to_be_visible(timeout=62000)

            # 6. Verify regeneration
            is_flattened_after_regen = await page.evaluate(f'(index) => window.stoneDeposits[index].flattened', closest_deposit_index)
            if is_flattened_after_regen:
                raise Exception("Deposit did not regenerate (still flattened).")
            print("SUCCESS: Deposit regenerated.")

            # 7. Verify collision
            initial_pos = await page.evaluate('() => ({ x: window.playerBody.position.x, z: window.playerBody.position.z })')

            print(f"Initial position for collision test: {initial_pos}")

            # Press 'W' to move forward
            await page.keyboard.down('w')
            await page.wait_for_timeout(2000) # Move forward for 2 seconds
            await page.keyboard.up('w')

            final_pos = await page.evaluate('() => ({ x: window.playerBody.position.x, z: window.playerBody.position.z })')
            print(f"Final position after collision test: {final_pos}")

            distance_moved = ((final_pos['x'] - initial_pos['x'])**2 + (final_pos['z'] - initial_pos['z'])**2)**0.5

            if distance_moved > 1.0: # If moved more than 1 unit, it likely passed through
                 raise Exception(f"Collision test failed. Player moved {distance_moved:.2f} units, likely passing through the deposit.")

            print(f"SUCCESS: Collision test passed. Player moved only {distance_moved:.2f} units.")


        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    import os
    asyncio.run(main())
