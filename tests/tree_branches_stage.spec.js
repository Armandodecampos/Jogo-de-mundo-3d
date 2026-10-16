import { test, expect } from '@playwright/test';

test('Verify tree branches only exist in adult stage (arvore_adulta)', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:8080/index.htm');

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.click('#startButton');
  await page.waitForFunction(() => window.isWorldReady === true, { timeout: 30000 });

  const result = await page.evaluate(() => {
    // Helper to count branch meshes in tree mesh group
    function countBranchMeshes(mesh) {
      let count = 0;
      if (mesh && mesh.children) {
        mesh.traverse(child => {
          if (child.userData && child.userData.isBranch) {
            count++;
          }
        });
      }
      return count;
    }

    // Spawn tree planted as 'semente'
    const sementeBody = window.createPlaceableBlock(
      new window.THREE.Vector3(10, 0, 10),
      null,
      'muda_arvore',
      'semente'
    );
    const sementeIndex = window.placedConstructionBodies.indexOf(sementeBody);
    const sementeMesh = window.placedConstructionMeshes[sementeIndex];
    const sementeBranchCount = countBranchMeshes(sementeMesh);

    // Spawn tree planted as 'muda'
    const mudaBody = window.createPlaceableBlock(
      new window.THREE.Vector3(20, 0, 10),
      null,
      'muda_arvore',
      'muda'
    );
    const mudaIndex = window.placedConstructionBodies.indexOf(mudaBody);
    const mudaMesh = window.placedConstructionMeshes[mudaIndex];
    const mudaBranchCount = countBranchMeshes(mudaMesh);

    // Spawn tree planted as 'media'
    const mediaBody = window.createPlaceableBlock(
      new window.THREE.Vector3(30, 0, 10),
      null,
      'muda_arvore',
      'media'
    );
    const mediaIndex = window.placedConstructionBodies.indexOf(mediaBody);
    const mediaMesh = window.placedConstructionMeshes[mediaIndex];
    const mediaBranchCount = countBranchMeshes(mediaMesh);

    // Spawn tree planted as 'arvore_adulta'
    const adultBody = window.createPlaceableBlock(
      new window.THREE.Vector3(40, 0, 10),
      null,
      'muda_arvore',
      'arvore_adulta'
    );
    const adultIndex = window.placedConstructionBodies.indexOf(adultBody);
    const adultMesh = window.placedConstructionMeshes[adultIndex];
    const adultBranchCount = countBranchMeshes(adultMesh);

    return {
      sementeBranchCount,
      mudaBranchCount,
      mediaBranchCount,
      adultBranchCount,
      hasAdultBranchUserData: !!(adultBody.userData && adultBody.userData.branches),
      hasSementeBranchUserData: !!(sementeBody.userData && sementeBody.userData.branches)
    };
  });

  expect(result.sementeBranchCount).toBe(0);
  expect(result.mudaBranchCount).toBe(0);
  expect(result.mediaBranchCount).toBe(0);
  expect(result.adultBranchCount).toBe(3);
  expect(result.hasAdultBranchUserData).toBe(true);
  expect(result.hasSementeBranchUserData).toBe(false);
});
