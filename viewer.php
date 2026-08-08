<?php
require_once __DIR__ . '/config.php';
requireAuth();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= APP_NAME ?> - Live Remote Viewer</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- PeerJS CDN -->
    <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
</head>
<body>

    <header class="navbar">
        <a href="index.php" class="brand">
            <div class="brand-icon" style="background: linear-gradient(135deg, var(--accent-green), #059669);"><i class="fa-solid fa-eye"></i></div>
            <span>Remote Live Monitor</span>
        </a>
        <div class="nav-actions">
            <a href="index.php" class="btn btn-secondary"><i class="fa-solid fa-house"></i> Dashboard</a>
        </div>
    </header>

    <main class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
            <div>
                <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.5rem;">Office Webcam Feed</h2>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                    Target Device: <span id="connectedDevice" style="color: #fff; font-weight: 500;">Searching...</span>
                </div>
            </div>
            <div id="viewerStatus" class="status-badge status-connecting">
                <span class="dot-pulse"></span> Connecting to Office...
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- Video Player Stage -->
            <div>
                <!-- Peer ID Connection Bar -->
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); flex-wrap: wrap;">
                    <label style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;"><i class="fa-solid fa-key"></i> Peer ID:</label>
                    <input type="text" id="manualPeerId" class="pin-input" style="flex: 1; min-width: 140px; padding: 6px 10px; font-size: 0.85rem; text-align: left; letter-spacing: normal;" placeholder="sands_office_laptop">
                    <button onclick="connectManualPeer()" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.82rem; white-space: nowrap;">
                        <i class="fa-solid fa-plug"></i> Connect Stream
                    </button>
                </div>

                <div class="video-stage-container">
                    <video id="remoteVideo" autoplay playsinline webkit-playsinline muted onclick="this.play()" style="display: none;"></video>
                    <img id="fallbackLiveStream" src="" alt="Live Stream Feed" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
                    
                    <div class="video-overlay-controls">
                        <button onclick="toggleAudioMute()" id="audioBtn" class="btn btn-secondary" style="padding: 8px 14px; font-size: 0.85rem;" title="Mute/Unmute Audio">
                            <i class="fa-solid fa-volume-xmark"></i> Sound Off
                        </button>
                        <button onclick="captureRemoteSnapshot()" class="btn btn-primary" style="padding: 8px 14px; font-size: 0.85rem;" title="Take Snapshot Photo">
                            <i class="fa-solid fa-camera"></i> Snapshot
                        </button>
                        <button onclick="toggleFullscreen()" class="btn btn-secondary" style="padding: 8px 14px; font-size: 0.85rem;" title="Fullscreen Mode">
                            <i class="fa-solid fa-expand"></i> Fullscreen
                        </button>
                    </div>
                </div>
            </div>

            <!-- Motion & Activity Logs -->
            <div class="panel-card">
                <div class="panel-title">
                    <span><i class="fa-solid fa-clock-rotate-left"></i> Motion Activity Log</span>
                    <button onclick="clearLogs()" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">Clear</button>
                </div>
                
                <div class="event-list" id="eventLogList">
                    <div style="color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Loading event history...</div>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal for Snapshot Viewer -->
    <div class="modal" id="snapshotModal" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 id="modalTitle" style="font-family: 'Outfit', sans-serif;">Motion Snapshot</h3>
                <button onclick="closeModal()" class="btn btn-secondary" style="padding: 4px 10px;">&times;</button>
            </div>
            <img id="modalImage" class="modal-img" src="" alt="Snapshot">
            <div style="text-align: right;">
                <a id="modalDownloadBtn" download="snapshot.jpg" class="btn btn-primary" onclick="this.href=document.getElementById('modalImage').src">
                    <i class="fa-solid fa-download"></i> Download Image
                </a>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
    <script>
        let isMuted = true;
        document.addEventListener('DOMContentLoaded', () => {
            const video = document.getElementById('remoteVideo');
            video.muted = true; // start muted for autoplay policy
            startRemoteViewer();
        });

        function toggleAudioMute() {
            const video = document.getElementById('remoteVideo');
            const btn = document.getElementById('audioBtn');
            isMuted = !isMuted;
            video.muted = isMuted;

            if (isMuted) {
                btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Sound Off';
            } else {
                btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Live Audio ON';
            }
        }

        function toggleFullscreen() {
            const container = document.querySelector('.video-stage-container');
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => alert(err.message));
            } else {
                document.exitFullscreen();
            }
        }

        async function clearLogs() {
            if (confirm('Clear all motion logs?')) {
                await fetch('api.php?action=clear_logs');
                loadEventLogs();
            }
        }
    </script>
</body>
</html>
