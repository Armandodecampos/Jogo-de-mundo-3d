const { test, expect } = require('@playwright/test');
const path = require('path');

test('visual verification of climbing and wall blocking', async ({ page }) => {
  // Increase timeout for complex setup
  test.setTimeout(60000);

  // Use file:// protocol for index.htm
  const filePath = 'file://' + path.resolve(__dirname, 'index.htm');
  await page.goto(filePath);

  // Wait for the "Jogar" button and click it
  const jogarButton = page.locator('button:has-text("Jogar")');
  await jogarButton.waitFor({ state: 'visible' });
  await jogarButton.click();

  // Wait for world to be ready
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  // 1. Test climbing a single block (0.435m)
  await page.evaluate(() => {
    // Clear everything
    for (let i = window.scene.children.length - 1; i >= 0; i--) {
        const obj = window.scene.children[i];
        if (obj.userData && obj.userData.isConstruction) {
            window.scene.remove(obj);
            window.world.removeBody(obj.userData.physicsBody);
        }
    }

    // Spawn a low block (0.435 height)
    const height = 0.435;
    const geometry = new THREE.BoxGeometry(1, height, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(2, height / 2, 0);
    mesh.userData.isConstruction = true;
    window.scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(0.5, height / 2, 0.5));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(2, height / 2, 0);
    window.world.addBody(body);
    mesh.userData.physicsBody = body;

    // Reset player position
    window.playerBody.position.set(0, 5, 0);
    window.playerBody.velocity.set(0, 0, 0);
  });

  // Wait for player to land
  await page.waitForTimeout(1000);

  // Move towards block
  await page.keyboard.down('w');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'climb_single_verify.png' });
  await page.keyboard.up('w');

  // 2. Test wall blocking (stacked blocks)
  await page.evaluate(() => {
    // Clear everything again
    for (let i = window.scene.children.length - 1; i >= 0; i--) {
        const obj = window.scene.children[i];
        if (obj.userData && obj.userData.isConstruction) {
            window.scene.remove(obj);
            window.world.removeBody(obj.userData.physicsBody);
        }
    }

    // Spawn a wall (1.0 height)
    const height = 1.0;
    const geometry = new THREE.BoxGeometry(1, height, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(2, height / 2, 0);
    mesh.userData.isConstruction = true;
    window.scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(0.5, height / 2, 0.5));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(2, height / 2, 0);
    window.world.addBody(body);
    mesh.userData.physicsBody = body;

    // Reset player position
    window.playerBody.position.set(0, 5, 0);
    window.playerBody.velocity.set(0, 0, 0);
  });

  // Wait for player to land
  await page.waitForTimeout(1000);

  // Move towards wall
  await page.keyboard.down('w');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'wall_block_verify.png' });
  await page.keyboard.up('w');
});
