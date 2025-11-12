
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Aumentar o tempo limite padrão
            page.set_default_timeout(60000) # 60 segundos

            await page.goto('http://localhost:8000')

            # Aguardar o botão "Jogar" e clicar nele
            print("Aguardando o botão 'Jogar'...")
            await page.wait_for_selector('#startButton', state='visible')
            await page.click('#startButton')
            print("Botão 'Jogar' clicado.")

            # Aguardar o mundo do jogo carregar
            print("Aguardando o mundo do jogo carregar...")
            await page.wait_for_function('window.isWorldReady === true')
            print("Mundo do jogo carregado.")

            # Mover o jogador para uma posição e orientação específicas
            await page.evaluate('''() => {
                playerBody.position.set(0, 2, 5);
                camera.rotation.x = -0.5;
            }''')

            # Ativar a ferramenta pá (mão esquerda, slot 0)
            await page.evaluate('selectedSlotIndex = 0; updateBeltDisplay();')

            # Simular o clique para cavar um buraco
            print("Simulando clique para cavar...")
            await page.mouse.down()
            await asyncio.sleep(0.1) # Simula um clique curto
            await page.mouse.up()

            # Aguardar um momento para o buraco ser criado
            await asyncio.sleep(1)

            # Tirar uma captura de tela
            screenshot_path = 'verification/hole_texture_verification_fix.png'
            await page.screenshot(path=screenshot_path)
            print(f"Captura de tela salva em: {screenshot_path}")

        except Exception as e:
            print(f"Ocorreu um erro: {e}")
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
