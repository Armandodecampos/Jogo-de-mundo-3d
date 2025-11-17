
document.addEventListener('DOMContentLoaded', () => {
    // This script will be run before the main script,
    // so we need to wait for the main script to initialize the variables.
    // A simple timeout should be sufficient for this testing scenario.
    setTimeout(() => {
        window.visualMounds = window.visualMounds || [];
        window.isWorldReady = window.isWorldReady || false;
        window.camera = window.camera || {};
    }, 500);
});
