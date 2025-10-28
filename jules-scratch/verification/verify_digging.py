import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8000")

        # Iniciar o jogo
        await page.click("#startButton")

        # Aguardar um tempo para o jogo carregar e o buraco ser cavado
        await page.wait_for_timeout(2000)

        # Tirar captura de tela
        await page.screenshot(path="jules-scratch/verification/digging_verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
