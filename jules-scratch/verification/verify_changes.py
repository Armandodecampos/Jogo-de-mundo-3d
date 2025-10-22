
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8000")

        # Espera o botão "Jogar" aparecer e clica nele
        await expect(page.locator("#startButton")).to_be_visible(timeout=10000)
        await page.locator("#startButton").click()

        # Espera o canvas do jogo ficar visível, indicando que o jogo começou
        await expect(page.locator("canvas")).to_be_visible(timeout=10000)

        # Espera um tempo fixo para os depósitos de pedra carregarem
        await page.wait_for_timeout(5000)

        # Tira a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
