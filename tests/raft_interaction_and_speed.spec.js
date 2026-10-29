import { test, expect } from '@playwright/test';

test('Raft interaction hints and speed verification', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 60000 });

  const result = await page.evaluate(async () => {
    Object.defineProperty(document, 'pointerLockElement', {
      get: () => window.renderer.domElement,
      configurable: true
    });

    const playerPos = window.playerBody ? window.playerBody.position : { x: 0, y: 1, z: 0 };

    // Place raft directly at player's location but slightly lower
    const raftX = playerPos.x;
    const raftY = playerPos.y - 0.2;
    const raftZ = playerPos.z - 1.0;

    window.createRaft(new CANNON.Vec3(raftX, raftY, raftZ));
    window.updateRaycastTargets();

    const raft = window.raftBodies[window.raftBodies.length - 1];

    // Aim camera looking straight down at the raft
    window.camera.position.set(playerPos.x, playerPos.y + 1.0, playerPos.z);
    window.camera.lookAt(raftX, raftY, raftZ);
    window.camera.updateMatrixWorld(true);

    await new Promise(r => setTimeout(r, 600));

    const currentLookedAt = window.currentLookedAtBody;
    const hintElem = document.getElementById('interactionHint');
    const hintWhenAiming = hintElem ? hintElem.innerText : '';

    // Enter raft
    window.isDrivingRaft = true;
    window.currentRaftBody = raft;

    await new Promise(r => setTimeout(r, 600));

    const hintWhenDriving = hintElem ? hintElem.innerText : '';

    return {
      raftCount: window.raftBodies.length,
      currentLookedAtIsRaft: currentLookedAt ? !!currentLookedAt.userData.isRaft : false,
      hintWhenAiming,
      hintWhenDriving
    };
  });

  console.log('Raft test result:', result);

  expect(result.raftCount).toBeGreaterThan(0);
  expect(result.hintWhenAiming).toContain('(Botão Esq.) Conduzir');
  expect(result.hintWhenAiming).toContain('(G) Guardar');
  expect(result.hintWhenDriving).toContain('Jangada');
  expect(result.hintWhenDriving).toContain('(Botão Esq.) Sair');
});
