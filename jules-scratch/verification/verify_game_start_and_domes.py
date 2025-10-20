import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Constrói o caminho absoluto para o ficheiro index.htm
        file_path = "file://" + os.path.abspath("index.htm")

        # Vai para o ficheiro local, esperando que tudo carregue
        await page.goto(file_path, wait_until="load")

        # Espera que o ecrã de início seja visível
        await expect(page.locator("#startScreen")).to_be_visible(timeout=10000)

        # Clica no botão "Jogar"
        await page.locator("#startButton").click()

        # Espera que a mira apareça, indicando que o jogo começou
        await expect(page.locator("#crosshair")).to_be_visible(timeout=10000)

        # Espera um pouco para a cena renderizar completamente, incluindo os depósitos de pedra
        await page.wait_for_timeout(2000)

        # Tira o screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
