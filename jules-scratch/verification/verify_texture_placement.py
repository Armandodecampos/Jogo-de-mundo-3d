
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8000")

        # Iniciar o jogo
        await page.click("#startButton")

        # Esperar o jogo carregar
        await page.wait_for_function("() => window.world && window.world.bodies.length > 0")

        # Mover para a área de inclinação
        await page.keyboard.press("w", delay=2000)

        # Equipar o aplicador de textura
        await page.keyboard.press("e")

        # Posicionar a câmera
        await page.mouse.move(0, 200)

        # Aplicar a textura
        await page.mouse.down()
        await asyncio.sleep(0.1)
        await page.mouse.up()

        # Capturar a tela
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
