import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("file:///app/index.htm")

        # Inicia o jogo
        await page.click("button:has-text('Jogar')")

        # Espera o mundo estar pronto
        await page.wait_for_function("window.isWorldReady === true")

        # Verifica se as funções globais estão lá (opcional, mas bom para debug)
        has_init = await page.evaluate("typeof initRainAudio !== 'undefined'")
        print(f"initRainAudio existe: {has_init}")

        # Inicia o áudio da chuva e intensifica
        await page.evaluate("""() => {
            if (typeof initRainAudio !== 'undefined') initRainAudio();
            window.rainIntensity = 1.0;
            window.targetRainIntensity = 1.0;
        }""")

        # Pequeno delay para processar
        await asyncio.sleep(0.5)

        # Verifica estado inicial
        paused = await page.evaluate("window.gamePaused")
        print(f"Pausado inicial: {paused}")

        # Pressiona Esc
        await page.keyboard.press("Escape")

        # Pequeno delay
        await asyncio.sleep(0.5)

        # Verifica se pausou
        paused = await page.evaluate("window.gamePaused")
        print(f"Pausado após Esc: {paused}")

        # Verifica se o ganho do áudio da chuva é 0 quando pausado
        gain = await page.evaluate("window.rainGainNode ? window.rainGainNode.gain.value : 'N/A'")
        print(f"Ganho do áudio: {gain}")

        await browser.close()

asyncio.run(run())
