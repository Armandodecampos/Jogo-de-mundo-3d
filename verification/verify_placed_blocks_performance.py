import time
from playwright.sync_api import sync_playwright

def run_performance_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080/index.htm")
        page.wait_for_timeout(1000)

        # Start game
        page.click("#startButton")

        # Wait until world is ready
        page.wait_for_function("() => window.isWorldReady === true && window.playerBody !== undefined", timeout=10000)

        # Check initial world state
        result = page.evaluate("""() => {
            const player = window.playerBody;
            if (!player) return { error: "No playerBody" };

            // Give items to player
            window.giveAllItemsToPlayer();

            // Place 150 cob blocks around the player
            const initialCount = window.placedConstructionBodies.length;
            const px = player.position.x;
            const py = player.position.y;
            const pz = player.position.z;

            // Place 100 blocks near player and 50 blocks far away (150m away)
            for (let i = 0; i < 100; i++) {
                const ox = (i % 10) * 0.5 - 2.5;
                const oz = Math.floor(i / 10) * 0.5 - 2.5;
                window.createPlaceableBlock(
                    new THREE.Vector3(px + ox, py + 2 + (i % 3) * 0.4, pz + oz),
                    new THREE.Quaternion(),
                    'cob'
                );
            }

            for (let i = 0; i < 50; i++) {
                const ox = (i % 5) * 0.5;
                const oz = Math.floor(i / 5) * 0.5;
                window.createPlaceableBlock(
                    new THREE.Vector3(px + 150 + ox, py + 2, pz + 150 + oz),
                    new THREE.Quaternion(),
                    'cob'
                );
            }

            const totalPlaced = window.placedConstructionBodies.length;
            const bodiesInWorld = window.world.bodies.length;

            return {
                initialCount,
                totalPlaced,
                bodiesInWorld
            };
        }""")

        print("Initial placement result:", result)
        assert result["totalPlaced"] >= 150, "Expected at least 150 placed blocks"

        # Allow physics step to run
        page.wait_for_timeout(1000)

        # Check active physics bodies count
        stats = page.evaluate("""() => {
            const totalPlaced = window.placedConstructionBodies.length;
            const totalWorldBodies = window.world.bodies.length;
            let activePlacedInWorld = 0;
            let inactivePlaced = 0;

            window.placedConstructionBodies.forEach(b => {
                if (b.world) activePlacedInWorld++;
                else inactivePlaced++;
            });

            return {
                totalPlaced,
                totalWorldBodies,
                activePlacedInWorld,
                inactivePlaced
            };
        }""")

        print("Physics active stats:", stats)
        assert stats["activePlacedInWorld"] >= 100, f"Expected nearby blocks active in world, got {stats['activePlacedInWorld']}"
        assert stats["inactivePlaced"] >= 50, f"Expected distant blocks inactive in world, got {stats['inactivePlaced']}"

        # Test Save & Load with distant blocks
        page.evaluate("""() => {
            const saveData = window.getGameStateData();
            window.loadGameState(saveData);
        }""")

        # Allow next frame animation loop to run
        page.wait_for_timeout(500)

        save_load_result = page.evaluate("""() => {
            let activeCount = 0;
            let inactiveCount = 0;
            window.placedConstructionBodies.forEach(b => {
                if (b.world) activeCount++;
                else inactiveCount++;
            });

            return {
                restoredTotal: window.placedConstructionBodies.length,
                activeCount,
                inactiveCount
            };
        }""")

        print("Save/Load test result (after frame tick):", save_load_result)
        assert save_load_result["restoredTotal"] >= 150, "Save/Load should restore all placed blocks"
        assert save_load_result["inactiveCount"] >= 50, f"Expected distant blocks inactive after load, got {save_load_result['inactiveCount']}"

        # Take screenshot for visual verification
        page.screenshot(path="verification/performance_verification.png")

        browser.close()
        print("PERFORMANCE AND DISTANCE PHYSICS VERIFICATION PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_performance_test()
