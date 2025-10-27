
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:8000")

        # Iniciar o jogo
        await page.click("#startButton")

        # Esperar o jogo carregar
        await page.wait_for_function("() => window.stoneDeposits && window.stoneDeposits.length > 0")

        # Selecionar o pincel de textura
        await page.evaluate("() => { window.selectedSlotIndex = 1; window.updateBeltDisplay(); }")

        # Simular pintura
        await page.mouse.move(page.viewport_size['width'] / 2, page.viewport_size['height'] / 2)
        await page.mouse.down()
        await page.mouse.move(page.viewport_size['width'] / 2 + 50, page.viewport_size['height'] / 2 + 50)
        await page.mouse.up()

        # Capturar screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())
