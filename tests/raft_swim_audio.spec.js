import { test, expect } from '@playwright/test';

test('Swimming audio gain is 0 when mounting and driving the raft', async ({ page }) => {
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

    // Ensure audio context is running
    if (window.gameAudioContext && window.gameAudioContext.state === 'suspended') {
      await window.gameAudioContext.resume();
    }

    // Place raft in sea
    let seaX = 250, seaZ = 100;
    window.createRaft(new CANNON.Vec3(seaX, -8, seaZ));
    const raft = window.raftBodies[window.raftBodies.length - 1];

    // Put player in water near raft
    window.playerBody.position.set(seaX, -8.5, seaZ);

    // Simulate press movement key in water to trigger swimming audio target
    window.keysPressed['w'] = true;

    await new Promise(r => setTimeout(r, 200));

    // Mount raft
    window.isDrivingRaft = true;
    window.currentRaftBody = raft;

    // Trigger audio update in loop
    await new Promise(r => setTimeout(r, 200));

    const swimGainVal = window.swimGainNode ? window.swimGainNode.gain.value : 0;
    const isDriving = window.isDrivingRaft;

    return {
      swimGainVal,
      isDriving
    };
  });

  console.log('Swimming audio gain test result:', result);

  expect(result.isDriving).toBe(true);
  expect(result.swimGainVal).toBe(0);
});
