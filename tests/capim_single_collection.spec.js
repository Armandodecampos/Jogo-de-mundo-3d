import { test, expect } from '@playwright/test';

test('Verify single capim cluster collection na mira', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:8080/index.htm');
  await page.click('#startButton');

  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  const result = await page.evaluate(async () => {
    // Clear all capim clusters
    window.capimClusters.length = 0;

    // Create 2 capim clusters:
    // Cluster 1 at (10, 0, 10)
    // Cluster 2 at (10.8, 0, 10) - 0.8m away (outside 0.5m threshold)
    const p1 = new window.THREE.Vector3(10, window.getSurfaceHeight(10, 10), 10);
    const p2 = new window.THREE.Vector3(10.8, window.getSurfaceHeight(10.8, 10), 10);

    window.createCapim(p1);
    window.createCapim(p2);

    const initialCount = window.capimClusters.length;

    // Aim crosshair at (10, 10)
    const hitPoint = p1.clone();
    const ray = new window.THREE.Ray(
      new window.THREE.Vector3(10, 5, 10),
      new window.THREE.Vector3(0, -1, 0)
    );

    // Get targeted capim
    const targetedCluster = window.getCapimUnderCrosshair(hitPoint, ray, 0.5);

    // Verify only Cluster 1 is targeted
    const isTargetingCluster1 = targetedCluster && window.calculateWrappedDistance(targetedCluster.position, p1) < 0.1;

    // Check that aiming 0.8m away from both clusters targets nothing
    const emptyHitPoint = new window.THREE.Vector3(12, window.getSurfaceHeight(12, 10), 10);
    const emptyRay = new window.THREE.Ray(
      new window.THREE.Vector3(12, 5, 10),
      new window.THREE.Vector3(0, -1, 0)
    );
    const untargetedCluster = window.getCapimUnderCrosshair(emptyHitPoint, emptyRay, 0.5);

    return {
      initialCount,
      isTargetingCluster1,
      untargetedIsNil: untargetedCluster === null
    };
  });

  expect(result.initialCount).toBe(2);
  expect(result.isTargetingCluster1).toBe(true);
  expect(result.untargetedIsNil).toBe(true);
});
