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

            // Place 150 cob blocks: 20 blocks within 3m (interaction range) and 130 blocks farther than 10m
            const initialCount = window.placedConstructionBodies.length;
            const px = player.position.x;
            const py = player.position.y;
            const pz = player.position.z;

            // Nearby blocks (within 3m)
            for (let i = 0; i < 20; i++) {
                const ox = (i % 4) * 0.5 - 1.0;
                const oz = Math.floor(i / 4) * 0.5 - 1.0;
                window.createPlaceableBlock(
                    new THREE.Vector3(px + ox, py + 2 + (i % 2) * 0.4, pz + oz),
                    new THREE.Quaternion(),
                    'cob'
                );
            }

            // Distant blocks (15m to 150m away)
            for (let i = 0; i < 130; i++) {
                const ox = (i % 10) * 0.5;
                const oz = Math.floor(i / 10) * 0.5;
                window.createPlaceableBlock(
                    new THREE.Vector3(px + 15 + ox, py + 2, pz + 15 + oz),
                    new THREE.Quaternion(),
                    'cob'
                );
            }

            const totalPlaced = window.placedConstructionBodies.length;
            return {
                initialCount,
                totalPlaced
            };
        }""")

        print("Initial placement result:", result)
        assert result["totalPlaced"] >= 150, "Expected at least 150 placed blocks"

        # Allow physics step and raycast updates to run
        page.wait_for_timeout(1000)

        # Check active physics bodies count & raycast targets
        stats = page.evaluate("""() => {
            const totalPlaced = window.placedConstructionBodies.length;
            let activePlacedInWorld = 0;
            let inactivePlaced = 0;

            window.placedConstructionBodies.forEach(b => {
                if (b.world) activePlacedInWorld++;
                else inactivePlaced++;
            });

            return {
                totalPlaced,
                totalWorldBodies: window.world.bodies.length,
                totalRaycastTargets: window.raycastTargets.length,
                activePlacedInWorld,
                inactivePlaced
            };
        }""")

        print("Physics & Raycast active stats:", stats)
        # Nearby blocks (<= 5m) should be active, distant blocks (> 5m) should be inactive
        assert stats["activePlacedInWorld"] <= 30, f"Expected physics active count to be small (<=30), got {stats['activePlacedInWorld']}"
        assert stats["inactivePlaced"] >= 120, f"Expected distant blocks (>5m) to be inactive in physics, got {stats['inactivePlaced']}"

        # Test Save & Load
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
        assert save_load_result["inactiveCount"] >= 120, f"Expected distant blocks inactive after load, got {save_load_result['inactiveCount']}"

        browser.close()
        print("INTERACTION DISTANCE PERFORMANCE VERIFICATION PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_performance_test()
