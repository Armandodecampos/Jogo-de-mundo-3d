import re

def test_verify_capim_on_mounds():
    files = ["index.htm", "jogo 3d (02-03-26).htm"]
    for filepath in files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Check respawnCapim filter for dirt mounds
        assert "dirtMounds = mounds.filter" in content or "m.itemType === dirtItemName" in content, f"Dirt mound filter missing in {filepath}"

        # Check startDestruction grass creation on dirt mounds
        assert "createCapim(new THREE.Vector3(mx, my, mz))" in content, f"Grass creation on elevated dirt mound missing in {filepath}"

    print("Verification passed! Both files contain dirt mound grass spawning logic.")

if __name__ == "__main__":
    test_verify_capim_on_mounds()
