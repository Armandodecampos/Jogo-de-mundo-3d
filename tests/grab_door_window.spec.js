const { test, expect } = require('@playwright/test');

test('Verify Porta (Door) and Janela (Window) cannot be grabbed with F key (grabObject)', async ({ page }) => {
    await page.goto('http://localhost:8080/index.htm');
    await page.click('#startButton');

    // Wait for world ready
    await page.waitForFunction(() => window.isWorldReady === true);

    const result = await page.evaluate(() => {
        // Create door body
        const doorBody = {
            position: new CANNON.Vec3(),
            quaternion: new CANNON.Quaternion(),
            type: CANNON.Body.STATIC,
            collisionResponse: true,
            userData: {
                type: window.doorItemName,
                isCollectible: true
            }
        };

        // Create window body
        const windowBody = {
            position: new CANNON.Vec3(),
            quaternion: new CANNON.Quaternion(),
            type: CANNON.Body.STATIC,
            collisionResponse: true,
            userData: {
                type: window.windowItemName,
                isCollectible: true
            }
        };

        // Create a normal grabbable box body for comparison
        const boxBody = {
            position: new CANNON.Vec3(),
            quaternion: new CANNON.Quaternion(),
            type: CANNON.Body.DYNAMIC,
            collisionResponse: true,
            userData: {
                type: 'caixote',
                isCollectible: true
            }
        };

        window.placedConstructionBodies.push(doorBody);
        window.placedConstructionBodies.push(windowBody);
        window.placedConstructionBodies.push(boxBody);

        // Attempt to grab door
        window.raycaster.intersectObjects = () => [
            {
                distance: 1.0,
                object: { userData: { physicsBody: doorBody } }
            }
        ];
        window.grabObject();
        const doorGrabbed = doorBody.type === CANNON.Body.KINEMATIC;

        // Attempt to grab window
        window.raycaster.intersectObjects = () => [
            {
                distance: 1.0,
                object: { userData: { physicsBody: windowBody } }
            }
        ];
        window.grabObject();
        const windowGrabbed = windowBody.type === CANNON.Body.KINEMATIC;

        // Attempt to grab box
        window.raycaster.intersectObjects = () => [
            {
                distance: 1.0,
                object: { userData: { physicsBody: boxBody } }
            }
        ];
        window.grabObject();
        const boxGrabbed = boxBody.type === CANNON.Body.KINEMATIC;

        return {
            doorGrabbed,
            windowGrabbed,
            boxGrabbed
        };
    });

    expect(result.doorGrabbed).toBe(false);
    expect(result.windowGrabbed).toBe(false);
    expect(result.boxGrabbed).toBe(true);
});
