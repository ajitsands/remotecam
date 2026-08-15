<?php
require_once __DIR__ . '/config.php';
sendSecurityHeaders();

$authenticated = isLoggedIn();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= APP_NAME ?> - Security Portal</title>
    <link rel="stylesheet" href="css/style.css?v=<?= APP_VERSION ?>">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <header class="navbar">
        <a href="index.php" class="brand">
            <div class="brand-icon"><i class="fa-solid fa-shield-halved"></i></div>
            <span>SandS CamGuard</span>
        </a>
        <?php if ($authenticated): ?>
            <div class="nav-actions">
                <button onclick="handleLogout()" class="btn btn-secondary"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
            </div>
        <?php endif; ?>
    </header>

    <main class="container">
        <?php if (!$authenticated): ?>
            <!-- Login Form -->
            <div class="auth-wrapper">
                <div class="auth-card">
                    <div class="brand-icon" style="margin: 0 auto 1.5rem; width: 50px; height: 50px; font-size: 1.4rem;">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h2>Security Verification</h2>
                    <p>Enter your secret PIN to access the remote camera control portal</p>
                    
                    <form id="loginForm" onsubmit="handleLogin(event)">
                        <div class="pin-input-group">
                            <input type="password" id="pinInput" class="pin-input" maxlength="6" placeholder="••••" required autofocus autocomplete="off">
                        </div>
                        <div id="loginError" style="color: var(--accent-red); font-size: 0.85rem; margin-bottom: 1rem; display: none;"></div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fa-solid fa-key"></i> Authenticate</button>
                    </form>
                </div>
            </div>
        <?php else: ?>
            <!-- Dashboard Mode Selection -->
            <div style="text-align: center; margin-top: 1rem;">
                <h1 style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 700;">Remote Webcam Monitoring</h1>
                <p style="color: var(--text-muted); font-size: 1.05rem; margin-top: 0.4rem;">Select mode depending on which device you are currently configuring</p>
            </div>

            <div class="mode-grid">
                <!-- Mode 1: Office Laptop (Camera Host) -->
                <div class="mode-card">
                    <div>
                        <div class="mode-icon office">
                            <i class="fa-solid fa-laptop-code"></i>
                        </div>
                        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; margin-bottom: 0.5rem;">Office Laptop (Camera Mode)</h2>
                        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.5;">
                            Run this on your <strong>Office Laptop</strong> before leaving. It accesses your webcam, broadcasts via encrypted WebRTC, and runs background motion detection.
                        </p>
                    </div>
                    <div style="margin-top: 2rem;">
                        <a href="camera.php" class="btn btn-primary btn-block">
                            <i class="fa-solid fa-video"></i> Launch Office Camera
                        </a>
                    </div>
                </div>

                <!-- Mode 2: Remote Home (Viewer) -->
                <div class="mode-card">
                    <div>
                        <div class="mode-icon remote">
                            <i class="fa-solid fa-display"></i>
                        </div>
                        <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; margin-bottom: 0.5rem;">Remote Viewer (Home / Mobile)</h2>
                        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.5;">
                            Open this on your <strong>Home Computer or Phone</strong>. Connects live to your office laptop video feed over the internet with low latency.
                        </p>
                    </div>
                    <div style="margin-top: 2rem;">
                        <a href="viewer.php" class="btn btn-secondary btn-block">
                            <i class="fa-solid fa-eye"></i> Open Live Stream Viewer
                        </a>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </main>

    <script>
        async function handleLogin(e) {
            e.preventDefault();
            const pin = document.getElementById('pinInput').value;
            const errorDiv = document.getElementById('loginError');
            errorDiv.style.display = 'none';

            try {
                const res = await fetch('api.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin: pin })
                });

                const data = await res.json();
                if (data.status === 'success') {
                    window.location.reload();
                } else {
                    errorDiv.textContent = data.message || 'Authentication failed';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                errorDiv.textContent = 'Server connection error';
                errorDiv.style.display = 'block';
            }
        }

        async function handleLogout() {
            await fetch('api.php?action=logout');
            window.location.href = 'index.php';
        }
    </script>
</body>
</html>
