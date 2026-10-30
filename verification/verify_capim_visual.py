import http.server
import socketserver
import threading
import time
import socket
import os
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

    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                record_video_dir="/home/jules/verification/videos"
            )
            page = context.new_page()

            page.goto(f"http://localhost:{PORT}/index.htm")
            page.wait_for_timeout(500)

            page.click("#startButton")
            page.wait_for_function("() => window.isWorldReady === true", timeout=15000)
            page.wait_for_timeout(500)

            # Spawn capim up to 10000
            page.evaluate("""() => {
                window.targetCapimCount = 10000;
                window.respawnCapim(10000);
            }""")

            page.wait_for_timeout(1000)

            screenshot_path = "/home/jules/verification/screenshots/capim_10000_dense.png"
            page.screenshot(path=screenshot_path)
            page.wait_for_timeout(1000)

            video_files = []
            context.close()
            browser.close()

            video_dir = "/home/jules/verification/videos"
            if os.path.exists(video_dir):
                for f in os.listdir(video_dir):
                    if f.endswith(".webm"):
                        video_files.append(os.path.join(video_dir, f))

            print("Screenshot saved to:", screenshot_path)
            print("Video files:", video_files)
            return screenshot_path, video_files
    finally:
        httpd.shutdown()

if __name__ == "__main__":
    run_verification()
