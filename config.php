<?php
/**
 * Application Configuration & Helper Functions
 * Remote Webcam Monitoring System
 */

// Set custom session save path to prevent cPanel alt-php session path permission warnings
$sessionSavePath = __DIR__ . '/data/sessions';
if (!file_exists($sessionSavePath)) {
    @mkdir($sessionSavePath, 0755, true);
}
if (is_dir($sessionSavePath) && is_writable($sessionSavePath)) {
    @session_save_path($sessionSavePath);
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

// System Security Configuration
// Change this PIN to your secret 4-6 digit passcode before deploying to remote.sandslab.com
define('SECURITY_PIN', '1234'); 
define('APP_NAME', 'SandS CamGuard Remote');
define('DATA_DIR', __DIR__ . '/data');
define('PEER_DATA_FILE', DATA_DIR . '/peer_status.json');
define('LOGS_DATA_FILE', DATA_DIR . '/motion_logs.json');

// Ensure data directory exists
if (!file_exists(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}

// JSON Output Helper
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

// Check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
}

// Auth Guard
function requireAuth() {
    if (!isLoggedIn()) {
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
            jsonResponse(['status' => 'error', 'message' => 'Unauthorized access. Please log in.'], 401);
        } else {
            header('Location: index.php');
            exit;
        }
    }
}
