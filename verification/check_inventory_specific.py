
import asyncio
from playwright.async_api import async_playwright

async def verify_inventory():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        await page.goto('http://localhost:8080')
        await page.click('#startButton')
        await page.wait_for_function('window.isWorldReady === true')

        # Check specific crates
        result = await page.evaluate('''() => {
            const boxes = window.collectibleBoxes;
            const crate5 = boxes.find(b => Math.abs(b.body.position.x) < 1 && Math.abs(b.body.position.z - (-5)) < 1);
            const crate10 = boxes.find(b => Math.abs(b.body.position.x) < 1 && Math.abs(b.body.position.z - (-10)) < 1);

            return {
                crate5: crate5 ? {
                    pos: crate5.body.position,
                    inventory: crate5.body.userData.inventory ? crate5.body.userData.inventory.filter(i => i !== null) : "No inventory"
                } : "Not found",
                crate10: crate10 ? {
                    pos: crate10.body.position,
                    inventory: crate10.body.userData.inventory ? crate10.body.userData.inventory.filter(i => i !== null) : "No inventory"
                } : "Not found"
            };
        }''')

        import json
        print(json.dumps(result, indent=2))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_inventory())
