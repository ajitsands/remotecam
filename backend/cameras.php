<?php
/**
 * SanDS Lab CCTV Cloud - Camera Management & Multi-Stream API
 */

require_once __DIR__ . '/db.php';

$userId = requireLogin();
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper to format full live URLs for a camera
function enrichCameraData($cam) {
    $cam['camera_type'] = $cam['camera_type'] ?? 'rtmp';
    $cam['is_favorite'] = (bool)($cam['is_favorite'] ?? 0);
    $cam['ptz_enabled'] = (bool)($cam['ptz_enabled'] ?? 0);

    $host = $cam['server_host'] ?: 'camera.sandslab.com';
    $streamKey = $cam['stream_key'] ?: 'camera1';
    $rtmpPort = $cam['rtmp_port'] ?: 1935;
    $webrtcPort = $cam['webrtc_port'] ?: 8889;
    $hlsPort = $cam['hls_port'] ?: 8888;

    $cam['rtmp_ingest_url'] = "rtmp://{$host}:{$rtmpPort}/live/{$streamKey}";
    $cam['webrtc_play_url'] = "http://{$host}:{$webrtcPort}/live/{$streamKey}";
    $cam['hls_play_url'] = "http://{$host}:{$hlsPort}/live/{$streamKey}/index.m3u8";

    // ONVIF / RTSP specific attributes
    if ($cam['camera_type'] === 'onvif' || $cam['camera_type'] === 'rtsp') {
        $onvifHost = $cam['onvif_host'] ?: $host;
        $onvifPort = $cam['onvif_port'] ?: 80;
        $rtspPort = $cam['rtsp_port'] ?: 554;
        $rtspPath = ltrim($cam['rtsp_path'] ?: 'live/ch0', '/');
        $user = $cam['onvif_username'] ?? '';
        $pass = $cam['onvif_password'] ?? '';
        
        $authPrefix = ($user !== '' ? rawurlencode($user) . ($pass !== '' ? ':' . rawurlencode($pass) : '') . '@' : '');
        $cam['rtsp_url'] = "rtsp://{$authPrefix}{$onvifHost}:{$rtspPort}/{$rtspPath}";
        $cam['rtsp_display_url'] = "rtsp://" . ($user !== '' ? rawurlencode($user) . ':••••••••@' : '') . "{$onvifHost}:{$rtspPort}/{$rtspPath}";
        $cam['onvif_endpoint'] = "http://{$onvifHost}:{$onvifPort}/onvif/device_service";
        $cam['has_onvif_password'] = !empty($pass);
        // Do not expose raw password in standard API responses
        unset($cam['onvif_password']);
    }

    return $cam;
}

// 1. GET /backend/cameras.php - List all cameras for this user
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM cameras WHERE id = ? AND user_id = ? LIMIT 1");
        $stmt->execute([$id, $userId]);
        $cam = $stmt->fetch();
        if (!$cam) {
            sendJsonResponse(['status' => 'error', 'message' => 'Camera not found'], 404);
        }
        sendJsonResponse(['status' => 'success', 'camera' => enrichCameraData($cam)]);
    }

    $stmt = $pdo->prepare("SELECT * FROM cameras WHERE user_id = ? ORDER BY id ASC");
    $stmt->execute([$userId]);
    $cameras = $stmt->fetchAll();

    $enriched = array_map('enrichCameraData', $cameras);
    sendJsonResponse(['status' => 'success', 'count' => count($enriched), 'cameras' => $enriched]);
}

// 2. POST /backend/cameras.php - Add a new camera
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $location = trim($data['location'] ?? 'Location');
    $cameraType = in_array($data['camera_type'] ?? '', ['rtmp', 'onvif', 'rtsp', 'webrtc']) ? $data['camera_type'] : 'rtmp';
    $streamKey = trim($data['stream_key'] ?? '');
    $serverHost = trim($data['server_host'] ?? 'earth.rechargingsolution.in');
    $resolution = trim($data['resolution'] ?? '1080p');
    $notes = trim($data['notes'] ?? '');

    // ONVIF Specific
    $onvifHost = trim($data['onvif_host'] ?? '');
    $onvifPort = intval($data['onvif_port'] ?? 80) ?: 80;
    $onvifUsername = trim($data['onvif_username'] ?? '');
    $onvifPassword = trim($data['onvif_password'] ?? '');
    $rtspPort = intval($data['rtsp_port'] ?? 554) ?: 554;
    $rtspPath = trim($data['rtsp_path'] ?? 'live/ch0');
    $onvifProfile = trim($data['onvif_profile'] ?? 'Profile1');
    $ptzEnabled = !empty($data['ptz_enabled']) ? 1 : 0;

    if (empty($name)) {
        sendJsonResponse(['status' => 'error', 'message' => 'Camera Name is required.'], 400);
    }

    if ($cameraType === 'onvif' || $cameraType === 'rtsp') {
        if (empty($onvifHost)) {
            sendJsonResponse(['status' => 'error', 'message' => 'Camera IP / Host address is required for ONVIF/RTSP camera.'], 400);
        }
        if (empty($streamKey)) {
            $streamKey = 'onvif_' . preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($name)) . '_' . rand(100, 999);
        }
    } else {
        if (empty($streamKey)) {
            sendJsonResponse(['status' => 'error', 'message' => 'Stream Key (path) is required for RTMP camera.'], 400);
        }
    }

    // Sanitize streamKey (e.g. camera1, office_front)
    $streamKey = preg_replace('/[^a-zA-Z0-9_-]/', '', $streamKey);

    $stmt = $pdo->prepare("
        INSERT INTO cameras (
            user_id, name, location, camera_type, stream_key, server_host, resolution, notes,
            onvif_host, onvif_port, onvif_username, onvif_password, rtsp_port, rtsp_path, onvif_profile, ptz_enabled, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    ");
    $stmt->execute([
        $userId, $name, $location, $cameraType, $streamKey, $serverHost, $resolution, $notes,
        $onvifHost, $onvifPort, $onvifUsername, $onvifPassword, $rtspPort, $rtspPath, $onvifProfile, $ptzEnabled
    ]);

    $newId = $pdo->lastInsertId();
    $stmtGet = $pdo->prepare("SELECT * FROM cameras WHERE id = ?");
    $stmtGet->execute([$newId]);
    $cam = $stmtGet->fetch();

    sendJsonResponse([
        'status' => 'success',
        'message' => 'Camera registered successfully',
        'camera' => enrichCameraData($cam)
    ], 201);
}

// 3. PUT /backend/cameras.php?id=X - Edit Camera
if ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendJsonResponse(['status' => 'error', 'message' => 'Camera ID required'], 400);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $location = trim($data['location'] ?? '');
    $cameraType = in_array($data['camera_type'] ?? '', ['rtmp', 'onvif', 'rtsp', 'webrtc']) ? $data['camera_type'] : 'rtmp';
    $streamKey = trim($data['stream_key'] ?? '');
    $serverHost = trim($data['server_host'] ?? 'earth.rechargingsolution.in');
    $resolution = trim($data['resolution'] ?? '1080p');
    $status = trim($data['status'] ?? 'active');
    $isFavorite = !empty($data['is_favorite']) ? 1 : 0;
    $notes = trim($data['notes'] ?? '');

    // ONVIF Specific
    $onvifHost = trim($data['onvif_host'] ?? '');
    $onvifPort = intval($data['onvif_port'] ?? 80) ?: 80;
    $onvifUsername = trim($data['onvif_username'] ?? '');
    $onvifPassword = trim($data['onvif_password'] ?? '');
    $rtspPort = intval($data['rtsp_port'] ?? 554) ?: 554;
    $rtspPath = trim($data['rtsp_path'] ?? 'live/ch0');
    $onvifProfile = trim($data['onvif_profile'] ?? 'Profile1');
    $ptzEnabled = !empty($data['ptz_enabled']) ? 1 : 0;

    // Check if password was provided or if we should retain existing
    $stmtOld = $pdo->prepare("SELECT onvif_password FROM cameras WHERE id = ? AND user_id = ?");
    $stmtOld->execute([$id, $userId]);
    $oldCam = $stmtOld->fetch();
    if ($oldCam && empty($onvifPassword)) {
        $onvifPassword = $oldCam['onvif_password'];
    }

    $stmt = $pdo->prepare("
        UPDATE cameras 
        SET name = ?, location = ?, camera_type = ?, stream_key = ?, server_host = ?, resolution = ?, status = ?, is_favorite = ?, notes = ?,
            onvif_host = ?, onvif_port = ?, onvif_username = ?, onvif_password = ?, rtsp_port = ?, rtsp_path = ?, onvif_profile = ?, ptz_enabled = ?
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([
        $name, $location, $cameraType, $streamKey, $serverHost, $resolution, $status, $isFavorite, $notes,
        $onvifHost, $onvifPort, $onvifUsername, $onvifPassword, $rtspPort, $rtspPath, $onvifProfile, $ptzEnabled,
        $id, $userId
    ]);

    $stmtGet = $pdo->prepare("SELECT * FROM cameras WHERE id = ?");
    $stmtGet->execute([$id]);
    $cam = $stmtGet->fetch();

    sendJsonResponse([
        'status' => 'success',
        'message' => 'Camera updated successfully',
        'camera' => enrichCameraData($cam)
    ]);
}

// 4. DELETE /backend/cameras.php?id=X - Delete Camera
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendJsonResponse(['status' => 'error', 'message' => 'Camera ID required'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM cameras WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $userId]);

    sendJsonResponse(['status' => 'success', 'message' => 'Camera removed successfully']);
}

sendJsonResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
