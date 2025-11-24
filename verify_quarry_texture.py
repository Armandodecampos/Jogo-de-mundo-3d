
from playwright.sync_api import sync_playwright
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        messages = []
        page.on("console", lambda msg: messages.append(msg.text))

        try:
            page.goto("http://localhost:8000")
            page.click("#startButton", timeout=5000)

            # Wait for the game to load and start logging mountain colors
            time.sleep(10)

            # Check for the mountain color log
            mountain_color_logged = any("Mountain color:" in msg for msg in messages)

            if mountain_color_logged:
                print("Verification successful: Mountain color is being logged.")
            else:
                print("Verification failed: Mountain color not logged.")
                # Also print all messages for debugging
                print("\nCaptured console messages:")
                for msg in messages:
                    print(msg)

        except Exception as e:
            print(f"An error occurred: {e}")
            print("\nCaptured console messages:")
            for msg in messages:
                print(msg)

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
