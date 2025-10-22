
import asyncio
from playwright.async_api import async_playwright, expect
import math

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Adicionar ouvintes de eventos para um diagnóstico mais completo
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))
        page.on("requestfailed", lambda request: print(f"REQUEST FAILED: {request.url} {request.failure.error_text if request.failure else 'N/A'}"))

        try:
            await page.goto("http://localhost:8000")

            # Iniciar o jogo
            await page.get_by_role("button", name="Jogar").click()

            # Aguardar o carregamento do jogo esperando que a mira apareça
            await expect(page.locator("#crosshair")).to_be_visible(timeout=10000)
            await page.locator("canvas").click()

            # Aguardar o carregamento completo do mundo, verificando se os depósitos de pedra foram criados
            await page.wait_for_function("() => window.stoneDeposits && window.stoneDeposits.length > 0", timeout=20000)

            # Pressionar 'Q' para garantir que o item de construção (cob) esteja selecionado
            await page.keyboard.press('q')
            await page.wait_for_timeout(500) # Pequena pausa para garantir que a seleção do item seja processada

            # Avaliar o script na página para apontar a câmera para o primeiro depósito de pedra
            await page.evaluate("""() => {
                const deposit = window.stoneDeposits[0];
                const playerPosition = window.playerBody.position;
                const camera = window.camera;

                const dx = deposit.x - playerPosition.x;
                const dy = (deposit.y + 1) - (playerPosition.y + camera.position.y); // Apontar um pouco acima da base
                const dz = deposit.z - playerPosition.z;

                const yaw = Math.atan2(dx, dz);
                const pitch = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

                camera.rotation.y = yaw;
                camera.rotation.x = pitch;
            }""")

            await page.wait_for_timeout(1000) # Pausa para renderização

            # Tirar a captura de tela para verificação visual
            screenshot_path = "jules-scratch/verification/verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Captura de tela salva em: {screenshot_path}")

        except Exception as e:
            print(f"Ocorreu um erro: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
