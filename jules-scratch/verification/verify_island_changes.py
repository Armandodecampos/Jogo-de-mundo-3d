import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Captura e imprime as mensagens da consola
        page.on("console", lambda msg: print(f"LOG DA PÁGINA: {msg.text}"))

        # Navega para o arquivo local
        await page.goto(f"file://{os.path.abspath('index.htm')}", wait_until="load")

        # Chama a função startGame() diretamente
        await page.evaluate('window.startGame()')

        # Espera a mira aparecer, indicando que o jogo carregou
        await expect(page.locator("#crosshair")).to_be_visible(timeout=30000)

        # Aguarda um momento para a renderização completa
        await page.wait_for_timeout(2000)

        # Tira a captura de tela
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())