<?php
require_once __DIR__ . '/config.php';
requireAuth();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= APP_NAME ?> - Office Camera Host</title>
    <link rel="stylesheet" href="css/style.css?v=<?= time() ?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- PeerJS CDN -->
    <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
</head>
<body>

    <div class="stealth-banner" id="stealthBanner">
        <i class="fa-solid fa-eye-slash" style="font-size: 2rem; margin-bottom: 10px;"></i><br>
        <strong>Stealth Camera Mode Active</strong><br>
        Webcam is capturing in dark mode. Double click or press ESC to show controls.
    </div>

    <header class="navbar">
        <a href="index.php" class="brand">
            <div class="brand-icon"><i class="fa-solid fa-laptop-code"></i></div>
            <span>Office Camera Node</span>
        </a>
        <div class="nav-actions">
            <button onclick="toggleStealthMode()" class="btn btn-secondary" title="Dim screen so laptop screen stays dark"><i class="fa-solid fa-moon"></i> Stealth Mode</button>
            <a href="index.php" class="btn btn-secondary"><i class="fa-solid fa-house"></i> Portal</a>
        </div>
    </header>

    <main class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
                <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.5rem;">Office Laptop Camera Stream</h2>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                    Peer ID: <span id="peerIdDisplay" style="color: var(--accent-blue); font-weight: 600;">Generating...</span>
                </div>
            </div>
            <div id="cameraStatus" class="status-badge status-connecting">
                <span class="dot-pulse"></span> Initializing Camera...
            </div>
        </div>

        <!-- Motion Alert Banner -->
        <div id="motionAlertIndicator" style="display: none; background: rgba(245, 158, 11, 0.2); border: 1px solid var(--accent-amber); color: #fde68a; padding: 12px 18px; border-radius: var(--radius-md); margin-bottom: 1rem; text-align: center; font-weight: 600;">
            <i class="fa-solid fa-bell-ring fa-bounce"></i> MOTION DETECTED! Snapshot logged to server.
        </div>

        <div class="dashboard-grid">
            <!-- Video Preview Stage -->
            <div class="video-stage-container">
                <video id="cameraPreview" autoplay playsinline muted></video>
                
                <div class="video-overlay-controls">
                    <button onclick="toggleStealthMode()" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.85rem;">
                        <i class="fa-solid fa-eye-slash"></i> Dim Screen
                    </button>
                </div>
            </div>

            <!-- Controls Panel -->
            <div class="panel-card">
                <div class="panel-title">
                    <span><i class="fa-solid fa-sliders"></i> Camera Settings</span>
                </div>
                
                <div style="margin-top: 1rem;">
                    <label style="font-size: 0.9rem; font-weight: 500; display: block; margin-bottom: 8px;">
                        Motion Sensitivity
                    </label>
                    <input type="range" id="sensitivityRange" min="5" max="35" value="20" style="width: 100%; accent-color: var(--accent-blue);" onchange="motionSensitivity = parseInt(this.value)">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                    </div>
                </div>

                <div style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                    <button onclick="triggerMotionAlert(null)" class="btn btn-secondary btn-block" style="font-size: 0.85rem;">
                        <i class="fa-solid fa-camera"></i> Test Motion Snapshot
                    </button>
                </div>

                <div style="margin-top: 1.5rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 12px; border-radius: var(--radius-md); font-size: 0.8rem; color: #93c5fd; line-height: 1.4;">
                    <i class="fa-solid fa-circle-info"></i> <strong>Tip for Office Setup:</strong> Leave this tab open on your laptop. You can press <em>"Stealth Mode"</em> to dim the screen so nobody notices the screen is on while capturing.
                </div>
            </div>
        </div>
    </main>

    <script src="js/app.js?v=<?= time() ?>"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            startOfficeCamera();

            // Exit stealth mode on double click or ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') document.body.classList.remove('stealth-mode');
            });
            document.addEventListener('dblclick', () => {
                document.body.classList.remove('stealth-mode');
            });
        });
    </script>
</body>
</html>
