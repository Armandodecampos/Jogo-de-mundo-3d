import { test, expect } from '@playwright/test';

test('Verify beforeunload prompt on page reload/unload', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:8080/index.htm');

    // Click start button (Novo Jogo)
    await page.click('#startButton');

    // Wait for game/world readiness
    await page.waitForFunction(() => window.isWorldReady === true);

    // Dispatch beforeunload event and evaluate returned value/preventDefault
    const result = await page.evaluate(() => {
        let interceptedReturnValue = null;

        // Wrap or dispatch beforeunload event
        const event = new Event('beforeunload', { cancelable: true });

        // Intercept property definition on event or check beforeunload
        Object.defineProperty(event, 'returnValue', {
            get() { return interceptedReturnValue; },
            set(v) { interceptedReturnValue = v; }
        });

        window.dispatchEvent(event);

        return {
            defaultPrevented: event.defaultPrevented,
            returnValue: interceptedReturnValue
        };
    });

    expect(result.defaultPrevented).toBe(true);
    expect(result.returnValue).toContain('Deseja fechar a página');
});
