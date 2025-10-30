
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for all console events and print them
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        page.set_default_timeout(60000)

        await page.goto("http://localhost:8000")

        await page.click("#startButton")

        await page.wait_for_function("() => window.stoneDeposits && window.stoneDeposits.length > 0")

        await asyncio.sleep(2)

        async def select_tool(tool_name):
            await page.evaluate(f"""
                const beltItems = window.beltItems;
                let toolIndex = beltItems.findIndex(item => item && item.name === '{tool_name}');
                if (toolIndex !== -1) {{
                    window.selectedSlotIndex = toolIndex;
                    window.updateBeltDisplay();
                }} else {{
                    const backpackItems = window.backpackItems;
                    const backpackIndex = backpackItems.findIndex(item => item && item.name === '{tool_name}');
                    if (backpackIndex !== -1) {{
                        const emptyBeltSlot = beltItems.findIndex(item => item === null);
                        if (emptyBeltSlot !== -1) {{
                            beltItems[emptyBeltSlot] = backpackItems[backpackIndex];
                            backpackItems[backpackIndex] = null;
                            window.selectedSlotIndex = emptyBeltSlot;
                            window.updateBeltDisplay();
                            window.updateBackpackDisplay();
                        }}
                    }}
                }}
            """)

        await select_tool('martelo')

        await asyncio.sleep(1)

        await page.evaluate("""() => {
            const stoneDeposit = window.stoneDeposits[0];
            if (stoneDeposit) {
                const targetPos = new THREE.Vector3(stoneDeposit.x, stoneDeposit.y, stoneDeposit.z);
                window.camera.position.set(targetPos.x, targetPos.y + 2, targetPos.z + 5);
                window.camera.lookAt(targetPos);
            }
        }""")

        await page.locator('canvas').click()

        await page.mouse.down()
        await asyncio.sleep(3)
        await page.mouse.up()

        await asyncio.sleep(1)

        await page.screenshot(path="jules-scratch/verification/debris_verification.png")

        debris_count = await page.evaluate("() => window.debris.length")
        if debris_count > 0:
            print(f"Verification successful: {debris_count} debris pieces created.")
        else:
            raise Exception("Verification failed: No debris was created.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
