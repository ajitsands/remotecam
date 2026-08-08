<?php
/**
 * REST API Endpoint
 * Handles Authentication, PeerJS Signaling Heartbeats, and Motion Event Logging
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Public login action
if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $pin = $input['pin'] ?? $_POST['pin'] ?? '';

    if ($pin === SECURITY_PIN) {
        $_SESSION['authenticated'] = true;
        jsonResponse(['status' => 'success', 'message' => 'Authenticated successfully']);
    } else {
        jsonResponse(['status' => 'error', 'message' => 'Invalid Security PIN passcode'], 401);
    }
}

if ($action === 'logout') {
    session_destroy();
    jsonResponse(['status' => 'success', 'message' => 'Logged out successfully']);
}

// Public get_frame endpoint (for img tag loading)
if ($action === 'get_frame') {
    $frameFile = DATA_DIR . '/live_frame.jpg';
    $timeFile = DATA_DIR . '/frame_time.txt';

    if (file_exists($frameFile) && file_exists($timeFile)) {
        $lastFrameTime = (int)file_get_contents($timeFile);
        if ((time() - $lastFrameTime) <= 60) {
            header('Content-Type: image/jpeg');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
            readfile($frameFile);
            exit;
        }
    }
    http_response_code(404);
    exit;
}

// All actions below require authentication
requireAuth();

// 0. Live Frame Relay (HTTP Live Stream Fallback for strict firewalls/NATs)
if ($action === 'push_frame') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['frame'])) {
        $frameData = $input['frame'];
        if (preg_match('/^data:image\/(\w+);base64,/', $frameData, $type)) {
            $frameData = substr($frameData, strpos($frameData, ',') + 1);
        }
        $decoded = base64_decode($frameData);
        if ($decoded !== false) {
            if (!file_exists(DATA_DIR)) {
                @mkdir(DATA_DIR, 0755, true);
            }
            file_put_contents(DATA_DIR . '/live_frame.jpg', $decoded);
            file_put_contents(DATA_DIR . '/frame_time.txt', time());
            jsonResponse(['status' => 'success']);
        }
    }
    jsonResponse(['status' => 'error', 'message' => 'Invalid frame'], 400);
}

// 1. Register Camera Peer ID (Heartbeat from Office Laptop)
if ($action === 'register_peer') {
    $input = json_decode(file_get_contents('php://input'), true);
    $peerId = trim($input['peer_id'] ?? '');
    $deviceInfo = trim($input['device_info'] ?? 'Office Laptop');
    $battery = $input['battery'] ?? null;

    if (empty($peerId)) {
        jsonResponse(['status' => 'error', 'message' => 'Missing peer_id'], 400);
    }

    $peerData = [
        'peer_id' => $peerId,
        'device_info' => $deviceInfo,
        'battery' => $battery,
        'last_seen' => time(),
        'last_seen_formatted' => date('Y-m-d H:i:s')
    ];

    file_put_contents(PEER_DATA_FILE, json_encode($peerData, JSON_PRETTY_PRINT));
    jsonResponse(['status' => 'success', 'message' => 'Peer registered successfully', 'data' => $peerData]);
}

// 2. Get Active Camera Peer ID (For Remote Viewer)
if ($action === 'get_peer') {
    if (!file_exists(PEER_DATA_FILE)) {
        jsonResponse(['status' => 'offline', 'message' => 'No active office camera registered yet']);
    }

    $content = file_get_contents(PEER_DATA_FILE);
    $data = json_decode($content, true);

    if (!$data || empty($data['peer_id'])) {
        jsonResponse(['status' => 'offline', 'message' => 'Camera info empty']);
    }

    // Check if camera sent heartbeat in last 35 seconds
    $timeDiff = time() - ($data['last_seen'] ?? 0);
    $isOnline = ($timeDiff <= 35);

    jsonResponse([
        'status' => $isOnline ? 'online' : 'offline',
        'peer_id' => $data['peer_id'],
        'device_info' => $data['device_info'] ?? 'Office Laptop',
        'battery' => $data['battery'] ?? null,
        'last_seen_seconds_ago' => $timeDiff,
        'last_seen' => $data['last_seen_formatted'] ?? ''
    ]);
}

// 3. Log Motion Event or Snapshot Alert
if ($action === 'log_motion') {
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? 'Motion Detected';
    $snapshot = $input['snapshot'] ?? null;

    $logs = [];
    if (file_exists(LOGS_DATA_FILE)) {
        $logs = json_decode(file_get_contents(LOGS_DATA_FILE), true) ?: [];
    }

    $newLog = [
        'id' => uniqid('evt_'),
        'timestamp' => date('Y-m-d H:i:s'),
        'time_ago' => 'Just now',
        'type' => $type,
        'has_snapshot' => !empty($snapshot),
        'snapshot' => $snapshot
    ];

    // Keep max 50 recent events
    array_unshift($logs, $newLog);
    if (count($logs) > 50) {
        $logs = array_slice($logs, 0, 50);
    }

    file_put_contents(LOGS_DATA_FILE, json_encode($logs, JSON_PRETTY_PRINT));
    jsonResponse(['status' => 'success', 'message' => 'Event logged', 'log' => $newLog]);
}

// 4. Fetch Event Logs
if ($action === 'get_logs') {
    $logs = [];
    if (file_exists(LOGS_DATA_FILE)) {
        $logs = json_decode(file_get_contents(LOGS_DATA_FILE), true) ?: [];
    }
    jsonResponse(['status' => 'success', 'logs' => $logs]);
}

// 5. Clear Event Logs
if ($action === 'clear_logs') {
    file_put_contents(LOGS_DATA_FILE, json_encode([], JSON_PRETTY_PRINT));
    jsonResponse(['status' => 'success', 'message' => 'Logs cleared']);
}

jsonResponse(['status' => 'error', 'message' => 'Invalid action'], 400);
