
import asyncio
from playwright.async_api import async_playwright
import http.server
import socketserver
import threading
import os

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

async def verify():
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(f"http://localhost:{PORT}/index.htm")

        # Start the game
        await page.click("#startButton")

        # Wait for the world to be ready
        await page.wait_for_function("window.isWorldReady === true", timeout=60000)

        # Let it run for a bit to populate trees
        await asyncio.sleep(2)

        # Check for trees that are close to each other
        trees_info = await page.evaluate("""
            () => {
                const trees = window.placedConstructionBodies.filter(b => b.userData && b.userData.growthStage);
                let minPairDist = Infinity;
                for (let i = 0; i < trees.length; i++) {
                    for (let j = i + 1; j < trees.length; j++) {
                        const t1 = trees[i].position;
                        const t2 = trees[j].position;
                        const dx = t1.x - t2.x;
                        const dz = t1.z - t2.z;
                        const dist = Math.sqrt(dx*dx + dz*dz);
                        if (dist < minPairDist) minPairDist = dist;
                    }
                }
                return { count: trees.length, minPairDist };
            }
        """)

        print(f"Trees found: {trees_info['count']}")
        print(f"Minimum distance between any two trees: {trees_info['minPairDist']}")

        # Verify that there are trees closer than 6.0 (the old limit)
        if trees_info['minPairDist'] < 6.0:
            print("SUCCESS: Trees are placed closer than the previous 6.0 limit.")
        else:
            print("FAILURE: No trees found closer than 6.0 limit. Procedural generation might be sparse.")

        # Take a screenshot
        await page.screenshot(path="verification_screenshot.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
