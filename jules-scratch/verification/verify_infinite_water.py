import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # 1. Navegar para a página do jogo local.
        await page.goto("file:///app/index.htm")

        # 2. Clicar no botão "Jogar" para iniciar o jogo.
        start_button = page.locator("#startButton")
        await expect(start_button).to_be_visible()
        await start_button.click()

        # 3. Esperar que o jogo carregue. O jogador já começa longe.
        await asyncio.sleep(3)

        # 4. Tirar uma captura de ecrã para verificação visual.
        # A captura de ecrã deve mostrar que a água ainda está visível,
        # mesmo que o jogador esteja longe da origem (0,0).
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())