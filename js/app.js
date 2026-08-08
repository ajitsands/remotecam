/**
 * SandS CamGuard - Core PeerJS & Motion Engine
 */

let peer = null;
let currentCall = null;
let localStream = null;
let heartbeatInterval = null;
let motionInterval = null;
let lastFrameData = null;
let motionSensitivity = 20; // Lower = more sensitive
let isMotionDetectionActive = false;
let isWebRTCConnected = false;
let fallbackInterval = null;

// Initialize PeerJS Client
function initPeerJS(customId = null) {
    return new Promise((resolve, reject) => {
        // Options for PeerJS connection using public STUN servers
        const peerOptions = {
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:stun.services.mozilla.com' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        };

        peer = customId ? new Peer(customId, peerOptions) : new Peer(peerOptions);

        peer.on('open', (id) => {
            console.log('PeerJS initialized with ID:', id);
            resolve(id);
        });

        peer.on('error', (err) => {
            console.error('PeerJS Error:', err);
            reject(err);
        });
    });
}

// -------------------------------------------------------------
// OFFICE LAPTOP CAMERA CLIENT LOGIC
// -------------------------------------------------------------
async function startOfficeCamera() {
    const videoElement = document.getElementById('cameraPreview');
    const statusBadge = document.getElementById('cameraStatus');
    const peerIdDisplay = document.getElementById('peerIdDisplay');

    try {
        statusBadge.className = 'status-badge status-connecting';
        statusBadge.innerHTML = '<span class="dot-pulse"></span> Starting Camera...';

        // 1. Get User Media (Webcam + Audio)
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true
        });

        videoElement.srcObject = localStream;

        // 2. Init PeerJS
        const peerId = 'sands_cam_' + Math.random().toString(36).substring(2, 9);
        await initPeerJS(peerId);

        peerIdDisplay.textContent = peerId;
        statusBadge.className = 'status-badge status-online';
        statusBadge.innerHTML = '<span class="dot-pulse"></span> Camera Live & Ready';

        // 3. Register Peer & Start Heartbeat to PHP Backend
        registerCameraHeartbeat(peerId);
        heartbeatInterval = setInterval(() => registerCameraHeartbeat(peerId), 10000);

        // 4. Listen for incoming data connections & calls from Remote Viewer
        peer.on('connection', (conn) => {
            console.log('Incoming viewer data connection...');
            conn.on('data', (data) => {
                if (data && data.type === 'REQUEST_STREAM' && data.viewerId) {
                    console.log('Calling viewer back:', data.viewerId);
                    if (localStream) {
                        const call = peer.call(data.viewerId, localStream);
                        currentCall = call;
                    }
                }
            });
        });

        peer.on('call', (call) => {
            console.log('Incoming remote viewer direct call...');
            call.answer(localStream); // Answer call with local webcam stream
            currentCall = call;
        });

        // 5. Start Motion Detection & HTTP Frame Streamer
        startMotionDetection(videoElement);
        startFramePusher(videoElement);

    } catch (err) {
        console.error('Camera Access Error:', err);
        statusBadge.className = 'status-badge status-offline';
        statusBadge.innerHTML = 'Camera Error: ' + err.message;
        alert('Could not access webcam. Please ensure HTTPS and browser permissions are granted.');
    }
}

// HTTP Frame Streamer (Reliable live JPEG stream over HTTPS API)
function startFramePusher(videoElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 480;
    canvas.height = 270;

    setInterval(async () => {
        if (videoElement.paused || videoElement.ended || !localStream) return;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const frameBase64 = canvas.toDataURL('image/jpeg', 0.5);

        try {
            await fetch('api.php?action=push_frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frame: frameBase64 })
            });
        } catch (e) {}
    }, 300);
}

// Register Peer Heartbeat via PHP API
async function registerCameraHeartbeat(peerId) {
    let batteryLevel = null;
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            batteryLevel = Math.round(battery.level * 100);
        } catch (e) {}
    }

    try {
        await fetch('api.php?action=register_peer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                peer_id: peerId,
                device_info: navigator.userAgent.includes('Windows') ? 'Windows Office Laptop' : 'Office Device',
                battery: batteryLevel
            })
        });
    } catch (e) {
        console.warn('Heartbeat registration failed:', e);
    }
}

// Motion Detection Algorithm (Canvas Pixel Difference)
function startMotionDetection(videoElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 160;
    canvas.height = 90;

    isMotionDetectionActive = true;

    motionInterval = setInterval(() => {
        if (!isMotionDetectionActive || videoElement.paused || videoElement.ended) return;

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (lastFrameData) {
            let diffCount = 0;
            const totalPixels = currentFrame.data.length / 4;

            for (let i = 0; i < currentFrame.data.length; i += 4) {
                const rDiff = Math.abs(currentFrame.data[i] - lastFrameData.data[i]);
                const gDiff = Math.abs(currentFrame.data[i + 1] - lastFrameData.data[i + 1]);
                const bDiff = Math.abs(currentFrame.data[i + 2] - lastFrameData.data[i + 2]);

                if ((rDiff + gDiff + bDiff) / 3 > 30) {
                    diffCount++;
                }
            }

            const motionPercent = (diffCount / totalPixels) * 100;

            if (motionPercent > (100 - motionSensitivity * 4)) {
                console.log('Motion Detected! Change:', motionPercent.toFixed(1) + '%');
                triggerMotionAlert(canvas.toDataURL('image/jpeg', 0.6));
            }
        }

        lastFrameData = currentFrame;
    }, 800);
}

// Throttle motion logs so we don't spam
let lastMotionLoggedTime = 0;
async function triggerMotionAlert(snapshotBase64) {
    const now = Date.now();
    if (now - lastMotionLoggedTime < 8000) return; // 8 second cooldown
    lastMotionLoggedTime = now;

    // Visual Flash on camera page
    const alertBox = document.getElementById('motionAlertIndicator');
    if (alertBox) {
        alertBox.style.display = 'block';
        setTimeout(() => alertBox.style.display = 'none', 3000);
    }

    try {
        await fetch('api.php?action=log_motion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'Person/Motion Detected in Office',
                snapshot: snapshotBase64
            })
        });
    } catch (e) {}
}

// Toggle Office Laptop Stealth Mode
function toggleStealthMode() {
    document.body.classList.toggle('stealth-mode');
}

// -------------------------------------------------------------
// REMOTE VIEWER CLIENT LOGIC
// -------------------------------------------------------------
async function startRemoteViewer() {
    const videoElement = document.getElementById('remoteVideo');
    const statusBadge = document.getElementById('viewerStatus');
    const deviceBadge = document.getElementById('connectedDevice');

    statusBadge.className = 'status-badge status-connecting';
    statusBadge.innerHTML = '<span class="dot-pulse"></span> Locating Office Camera...';

    // Start instant HTTP live stream fallback
    startFallbackStream();

    // 1. Init PeerJS for Viewer
    await initPeerJS();

    // Listen for incoming calls back from camera host
    peer.on('call', (call) => {
        console.log('Receiving call back from camera host...');
        currentCall = call;
        call.answer(); // Answer without sending local stream
        handleIncomingStream(call, videoElement, statusBadge);
    });

    // 2. Poll API for active office camera peer ID
    async function checkAndConnect() {
        try {
            const res = await fetch('api.php?action=get_peer');
            const data = await res.json();

            if (data.status === 'online' && data.peer_id) {
                deviceBadge.textContent = data.device_info + ' (Last seen ' + data.last_seen_seconds_ago + 's ago)';
                
                if (!currentCall || !currentCall.open) {
                    connectToOfficeCamera(data.peer_id, videoElement, statusBadge);
                }
            } else {
                if (!isWebRTCConnected) {
                    statusBadge.className = 'status-badge status-offline';
                    statusBadge.innerHTML = 'Office Laptop Offline / Camera Closed';
                    deviceBadge.textContent = 'Waiting for laptop...';
                }
            }
        } catch (err) {
            console.error('Fetch peer error:', err);
        }
    }

    checkAndConnect();
    setInterval(checkAndConnect, 10000);
    loadEventLogs();
    setInterval(loadEventLogs, 10000);
}

// HTTP Live Stream Relay Fallback (Fetches JSON base64 frame)
function startFallbackStream() {
    const img = document.getElementById('fallbackLiveStream');
    const video = document.getElementById('remoteVideo');
    const statusBadge = document.getElementById('viewerStatus');
    if (!img) return;

    if (fallbackInterval) clearInterval(fallbackInterval);

    fallbackInterval = setInterval(async () => {
        if (isWebRTCConnected) return;

        try {
            const res = await fetch('api.php?action=get_frame&t=' + Date.now());
            const data = await res.json();

            if (data.status === 'success' && data.frame) {
                img.src = data.frame;
                img.style.display = 'block';
                if (video) video.style.display = 'none';

                if (statusBadge && !isWebRTCConnected) {
                    statusBadge.className = 'status-badge status-online';
                    statusBadge.innerHTML = '<span class="dot-pulse"></span> LIVE Feed (HTTPS Relay)';
                }
            }
        } catch (e) {}
    }, 400);
}

function handleIncomingStream(call, videoElement, statusBadge) {
    call.on('stream', (remoteStream) => {
        console.log('Receiving remote office webcam stream via WebRTC...');
        isWebRTCConnected = true;

        const img = document.getElementById('fallbackLiveStream');
        if (img) img.style.display = 'none';
        videoElement.style.display = 'block';
        videoElement.srcObject = remoteStream;
        videoElement.muted = true;
        
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                statusBadge.className = 'status-badge status-online';
                statusBadge.innerHTML = '<span class="dot-pulse"></span> LIVE WebRTC Feed';
            }).catch(err => {
                console.warn('Autoplay prevented:', err);
                statusBadge.className = 'status-badge status-online';
                statusBadge.innerHTML = '<span class="dot-pulse"></span> Live Stream Ready (Tap Video)';
            });
        }
    });

    call.on('close', () => {
        isWebRTCConnected = false;
    });

    call.on('error', (err) => {
        console.error('Call error:', err);
        isWebRTCConnected = false;
    });
}

function connectToOfficeCamera(officePeerId, videoElement, statusBadge) {
    if (!isWebRTCConnected) {
        statusBadge.className = 'status-badge status-connecting';
        statusBadge.innerHTML = '<span class="dot-pulse"></span> Connecting Stream...';
    }

    // 1. DataConnection Handshake
    try {
        const conn = peer.connect(officePeerId);
        conn.on('open', () => {
            console.log('Sending REQUEST_STREAM to camera host...');
            conn.send({ type: 'REQUEST_STREAM', viewerId: peer.id });
        });
    } catch (e) {
        console.warn('Data connection failed, falling back to direct call:', e);
    }

    // 2. Direct Call Fallback
    setTimeout(() => {
        if (!currentCall || !currentCall.open) {
            console.log('Triggering direct peer.call fallback...');
            const call = peer.call(officePeerId);
            if (call) {
                currentCall = call;
                handleIncomingStream(call, videoElement, statusBadge);
            }
        }
    }, 2500);
}

// Remote Snapshot Downloader
function captureRemoteSnapshot() {
    const video = document.getElementById('remoteVideo');
    const fallbackImg = document.getElementById('fallbackLiveStream');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (isWebRTCConnected && video && video.srcObject) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else if (fallbackImg && fallbackImg.naturalWidth) {
        canvas.width = fallbackImg.naturalWidth || 640;
        canvas.height = fallbackImg.naturalHeight || 360;
        ctx.drawImage(fallbackImg, 0, 0, canvas.width, canvas.height);
    } else {
        alert('No live stream available to capture snapshot.');
        return;
    }

    const link = document.createElement('a');
    link.download = 'office_snapshot_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_') + '.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
}

// Fetch & Render Event Logs in Remote Viewer
async function loadEventLogs() {
    const logList = document.getElementById('eventLogList');
    if (!logList) return;

    try {
        const res = await fetch('api.php?action=get_logs');
        const data = await res.json();

        if (data.status === 'success' && data.logs) {
            if (data.logs.length === 0) {
                logList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 10px;">No motion alerts detected yet.</div>';
                return;
            }

            logList.innerHTML = data.logs.map(log => `
                <div class="event-item">
                    ${log.snapshot ? `<img src="${log.snapshot}" class="event-thumb" onclick="openSnapshotModal('${log.snapshot}', '${log.timestamp}')" />` : '<div class="event-thumb"></div>'}
                    <div class="event-details">
                        <div class="event-type">${log.type}</div>
                        <div class="event-time">${log.timestamp}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {}
}

function openSnapshotModal(imgSrc, timestamp) {
    const modal = document.getElementById('snapshotModal');
    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    
    if (modal && modalImg) {
        modalImg.src = imgSrc;
        modalTitle.textContent = 'Motion Snapshot (' + timestamp + ')';
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('snapshotModal');
    if (modal) modal.classList.remove('active');
}
