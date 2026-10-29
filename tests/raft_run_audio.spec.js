import { test, expect } from '@playwright/test';

test('Running and walking audio gains are 0 when mounting and driving the raft', async ({ page }) => {
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

    if (window.gameAudioContext && window.gameAudioContext.state === 'suspended') {
      await window.gameAudioContext.resume();
    }

    // Place raft on beach/water edge
    window.createRaft(new CANNON.Vec3(0, 1, 0));
    const raft = window.raftBodies[window.raftBodies.length - 1];

    // Simulate running with WASD
    window.keysPressed['w'] = true;

    await new Promise(r => setTimeout(r, 200));

    // Mount raft
    window.isDrivingRaft = true;
    window.currentRaftBody = raft;

    await new Promise(r => setTimeout(r, 200));

    const grassGainVal = window.grassGainNode ? window.grassGainNode.gain.value : 0;
    const sandGainVal = window.sandGainNode ? window.sandGainNode.gain.value : 0;
    const isDriving = window.isDrivingRaft;

    return {
      grassGainVal,
      sandGainVal,
      isDriving
    };
  });

  console.log('Running audio gain test result:', result);

  expect(result.isDriving).toBe(true);
  expect(result.grassGainVal).toBe(0);
  expect(result.sandGainVal).toBe(0);
});
