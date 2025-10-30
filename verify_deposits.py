
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:8000")

            # Espera pelo botão de início e clica nele
            await page.wait_for_selector("#startButton", timeout=15000)
            await page.click("#startButton")

            # Espera um pouco para o mundo carregar
            await page.wait_for_timeout(5000)

            # Tira a captura de ecrã
            await page.screenshot(path="dirt_deposits_larger.png")
            print("Captura de ecrã guardada como dirt_deposits_larger.png")

        except Exception as e:
            print(f"Ocorreu um erro: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
