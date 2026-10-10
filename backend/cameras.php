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
    $host = $cam['server_host'] ?: 'camera.sandslab.com';
    $streamKey = $cam['stream_key'] ?: 'camera1';
    $rtmpPort = $cam['rtmp_port'] ?: 1935;
    $webrtcPort = $cam['webrtc_port'] ?: 8889;
    $hlsPort = $cam['hls_port'] ?: 8888;

    $cam['rtmp_ingest_url'] = "rtmp://{$host}:{$rtmpPort}/live/{$streamKey}";
    $cam['webrtc_play_url'] = "http://{$host}:{$webrtcPort}/live/{$streamKey}";
    $cam['hls_play_url'] = "http://{$host}:{$hlsPort}/live/{$streamKey}/index.m3u8";
    $cam['is_favorite'] = (bool)$cam['is_favorite'];
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
    $streamKey = trim($data['stream_key'] ?? '');
    $serverHost = trim($data['server_host'] ?? 'earth.rechargingsolution.in');
    $resolution = trim($data['resolution'] ?? '1080p');
    $notes = trim($data['notes'] ?? '');

    if (empty($name) || empty($streamKey)) {
        sendJsonResponse(['status' => 'error', 'message' => 'Camera Name and Stream Key (path) are required.'], 400);
    }

    // Sanitize streamKey (e.g. camera1, office_front)
    $streamKey = preg_replace('/[^a-zA-Z0-9_-]/', '', $streamKey);

    $stmt = $pdo->prepare("
        INSERT INTO cameras (user_id, name, location, stream_key, server_host, resolution, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    ");
    $stmt->execute([$userId, $name, $location, $streamKey, $serverHost, $resolution, $notes]);

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
    $streamKey = trim($data['stream_key'] ?? '');
    $serverHost = trim($data['server_host'] ?? 'earth.rechargingsolution.in');
    $resolution = trim($data['resolution'] ?? '1080p');
    $status = trim($data['status'] ?? 'active');
    $isFavorite = !empty($data['is_favorite']) ? 1 : 0;
    $notes = trim($data['notes'] ?? '');

    $stmt = $pdo->prepare("
        UPDATE cameras 
        SET name = ?, location = ?, stream_key = ?, server_host = ?, resolution = ?, status = ?, is_favorite = ?, notes = ?
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$name, $location, $streamKey, $serverHost, $resolution, $status, $isFavorite, $notes, $id, $userId]);

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
