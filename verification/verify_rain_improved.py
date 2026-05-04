import asyncio
from playwright.async_api import async_playwright
import time
import os

async def verify_rain():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Aumentar timeout para carregamento inicial
        page.set_default_timeout(60000)

        print("Carregando o jogo...")
        await page.goto('http://localhost:8080/index.htm')

        # Esperar o mundo estar pronto
        await page.wait_for_function("window.isWorldReady === true")
        print("Mundo pronto.")

        # Ativar chuva via console para garantir
        await page.evaluate("window.startRainCycle()")
        print("Chuva iniciada.")

        # Esperar a chuva ganhar intensidade
        await asyncio.sleep(5)

        # Verificar se a chuva está visível
        is_visible = await page.evaluate("window.rainParticles.visible")
        intensity = await page.evaluate("window.localRainIntensity")
        print(f"Chuva visível: {is_visible}, Intensidade: {intensity}")

        # Criar uma plataforma acima do jogador para testar oclusão
        print("Criando plataforma de teste para oclusão...")
        await page.evaluate("""
            const pos = window.playerBody.position;
            window.createBox(new THREE.Vector3(pos.x, pos.y + 5, pos.z));
        """)

        # Esperar atualização do mapa de oclusão
        await asyncio.sleep(2)

        # Tirar screenshot
        os.makedirs('screenshots', exist_ok=True)
        await page.screenshot(path='screenshots/rain_occlusion_test.png')
        print("Screenshot salva em screenshots/rain_occlusion_test.png")

        # Verificar se as partículas de chuva respeitam a oclusão (lógica interna)
        # Vamos simular movimento e ver se lastOcclusionPos atualiza
        pos_before = await page.evaluate("({x: window.lastOcclusionPos.x, y: window.lastOcclusionPos.y, z: window.lastOcclusionPos.z})")

        # Mover o jogador
        await page.evaluate("window.playerBody.position.x += 10")
        await asyncio.sleep(2) # Aguardar atualização (intervalo de 5 ou 60 frames)

        pos_after = await page.evaluate("({x: window.lastOcclusionPos.x, y: window.lastOcclusionPos.y, z: window.lastOcclusionPos.z})")
        print(f"Posição de oclusão antes: {pos_before}, depois: {pos_after}")

        if pos_before['x'] != pos_after['x']:
            print("VERIFICAÇÃO: lastOcclusionPos está sendo atualizado corretamente.")
        else:
            print("AVISO: lastOcclusionPos não mudou. Verifique se o loop de animação está rodando.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_rain())
