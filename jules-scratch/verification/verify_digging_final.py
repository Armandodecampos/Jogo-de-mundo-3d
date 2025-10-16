import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navega para o arquivo local
        await page.goto(f"file://{os.path.abspath('index.htm')}", wait_until="load")

        # Aguarda um momento para o script da página ser totalmente analisado
        await page.wait_for_timeout(1000)

        # Inicia o jogo
        await page.evaluate('window.startGame()')

        # Espera a mira aparecer
        await expect(page.locator("#crosshair")).to_be_visible(timeout=30000)

        # Equipa a pá
        await page.evaluate('''() => {
            const shovelIndex = window.backpackItems.findIndex(item => item && item.name === window.shovelItemName);
            if (shovelIndex > -1) {
                window.beltItems[0] = window.backpackItems[shovelIndex];
                window.selectedSlotIndex = 0;
            }
        }''')

        # Cava um buraco
        await page.evaluate('window.digHole()')

        # Aguarda um momento para a renderização
        await page.wait_for_timeout(1000)

        # Tira a captura de tela
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())