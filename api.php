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

    if (loginRateLimitExceeded()) {
        jsonResponse(['status' => 'error', 'message' => 'Too many failed attempts. Please wait 5 minutes before trying again.'], 429);
    }

    if (is_string($pin) && hash_equals(SECURITY_PIN, $pin)) {
        $_SESSION['authenticated'] = true;
        $_SESSION['last_activity'] = time();
        $_SESSION['login_attempts'] = [];
        session_regenerate_id(true);
        auditSecurityLog('AUTH SUCCESS');
        jsonResponse(['status' => 'success', 'message' => 'Authenticated successfully']);
    }

    recordFailedLoginAttempt();
    auditSecurityLog('INVALID PIN supplied');
    jsonResponse(['status' => 'error', 'message' => 'Invalid Security PIN passcode'], 401);
}

if ($action === 'logout') {
    session_destroy();
    jsonResponse(['status' => 'success', 'message' => 'Logged out successfully']);
}

// All actions below require authentication
requireAuth();

// 0. Live Frame Relay (JSON Base64 format matching working motion log format)
if ($action === 'push_frame') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['frame'])) {
        if (!file_exists(DATA_DIR)) {
            @mkdir(DATA_DIR, 0755, true);
        }
        $payload = [
            'frame' => $input['frame'],
            'timestamp' => time(),
            'formatted_time' => date('Y-m-d H:i:s')
        ];
        if (!writeJsonFile(DATA_DIR . '/live_frame.json', $payload)) {
            jsonResponse(['status' => 'error', 'message' => 'Failed to store frame on server'], 500);
        }
        jsonResponse(['status' => 'success']);
    }
    jsonResponse(['status' => 'error', 'message' => 'Invalid frame data'], 400);
}

// 0b. Fetch Latest Live Frame (JSON base64 relay — requires authentication)
if ($action === 'get_frame') {
    $frameFile = DATA_DIR . '/live_frame.json';

    if (file_exists($frameFile)) {
        $content = @file_get_contents($frameFile);
        $data = @json_decode($content, true);

        if ($data && !empty($data['frame'])) {
            $timeDiff = time() - ($data['timestamp'] ?? 0);
            if ($timeDiff <= 60) {
                jsonResponse([
                    'status' => 'success',
                    'frame' => $data['frame'],
                    'seconds_ago' => $timeDiff
                ]);
            }
        }
    }
    jsonResponse(['status' => 'offline', 'message' => 'No active live frame available'], 404);
}

// 1. Register Peer ID (Camera Heartbeat)
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

    if (!writeJsonFile(PEER_DATA_FILE, $peerData)) {
        jsonResponse(['status' => 'error', 'message' => 'Failed to persist peer registration'], 500);
    }
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

    // Keep max 50 recent events (leave room for the new entry)
    $logs = array_values(array_filter($logs, static fn($log) => is_array($log)));
    $logs = array_slice($logs, 0, 48);

    $newLog = [
        'id' => uniqid('evt_'),
        'ts' => time(),
        'timestamp' => date('Y-m-d H:i:s'),
        'time_ago' => 'Just now',
        'type' => $type,
        'has_snapshot' => !empty($snapshot),
        'snapshot' => $snapshot
    ];

    array_unshift($logs, $newLog);

    if (!writeJsonFile(LOGS_DATA_FILE, $logs)) {
        jsonResponse(['status' => 'error', 'message' => 'Failed to write event log'], 500);
    }

    // Never return snapshot payloads in list/log responses (fetch via get_snapshot on demand)
    unset($newLog['snapshot']);
    jsonResponse(['status' => 'success', 'message' => 'Event logged', 'log' => $newLog]);
}

// 4. Fetch Logs (metadata only — snapshot payloads are fetched on demand via get_snapshot)
if ($action === 'get_logs') {
    $logs = [];
    if (file_exists(LOGS_DATA_FILE)) {
        $logs = json_decode(file_get_contents(LOGS_DATA_FILE), true) ?: [];
    }
    $logs = pruneExpiredLogs($logs);
    foreach ($logs as $i => $log) {
        unset($logs[$i]['snapshot']); // keep payloads out of list responses
    }
    jsonResponse(['status' => 'success', 'logs' => array_values($logs)]);
}

// 4b. Fetch a single snapshot by event id (privacy: delivered only when explicitly requested)
if ($action === 'get_snapshot') {
    $id = $_GET['id'] ?? '';
    $logs = [];
    if (file_exists(LOGS_DATA_FILE)) {
        $logs = json_decode(file_get_contents(LOGS_DATA_FILE), true) ?: [];
    }
    foreach ($logs as $log) {
        if (is_array($log) && ($log['id'] ?? '') === $id) {
            $ts = isset($log['ts']) ? (int)$log['ts'] : (strtotime($log['timestamp'] ?? '') ?: time());
            if (!empty($log['snapshot']) && (time() - $ts) <= SNAPSHOT_RETENTION_SECONDS) {
                jsonResponse(['status' => 'success', 'snapshot' => $log['snapshot'], 'timestamp' => $log['timestamp'] ?? '']);
            }
            break;
        }
    }
    jsonResponse(['status' => 'error', 'message' => 'Snapshot not found or expired'], 404);
}

// 5. Clear Event Logs
if ($action === 'clear_logs') {
    if (!writeJsonFile(LOGS_DATA_FILE, [])) {
        jsonResponse(['status' => 'error', 'message' => 'Failed to clear logs'], 500);
    }
    jsonResponse(['status' => 'success', 'message' => 'Logs cleared']);
}

jsonResponse(['status' => 'error', 'message' => 'Invalid action'], 400);
