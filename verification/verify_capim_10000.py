import http.server
import socketserver
import threading
import time
import socket
from playwright.sync_api import sync_playwright

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def run_verification():
    PORT = get_free_port()

    class ReuseTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    Handler = http.server.SimpleHTTPRequestHandler
    httpd = ReuseTCPServer(("", PORT), Handler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(f"http://localhost:{PORT}/index.htm")
            page.wait_for_timeout(1000)

            page.click("#startButton")
            page.wait_for_function("() => window.isWorldReady === true", timeout=15000)

            result = page.evaluate("""() => {
                const initialCapimClusters = window.capimClusters.length;
                const freeIndicesInitial = window.capimFreeIndices.length;

                // Set targetCapimCount to 10000
                window.targetCapimCount = 10000;

                // Trigger respawnCapim in batches to spawn clusters
                window.respawnCapim(10000);

                const spawnedCapimClusters = window.capimClusters.length;
                const freeIndicesAfter = window.capimFreeIndices.length;

                return {
                    initialCapimClusters,
                    freeIndicesInitial,
                    spawnedCapimClusters,
                    freeIndicesAfter
                };
            }""")

            print("Verification Result:", result)

            totalPoolSize = result["initialCapimClusters"] + result["freeIndicesInitial"]
            assert totalPoolSize == 10000, f"Expected 10000 total pool size, got {totalPoolSize}"
            assert result["spawnedCapimClusters"] == 10000, f"Expected 10000 capim clusters spawned, got {result['spawnedCapimClusters']}"
            assert result["freeIndicesAfter"] == 0, f"Expected 0 free indices remaining after spawning 10000, got {result['freeIndicesAfter']}"

            browser.close()
            print("VERIFICATION PASSED: Jogo permite criar e renderizar até 10000 moitas de capim com sucesso!")
    finally:
        httpd.shutdown()

if __name__ == "__main__":
    run_verification()
