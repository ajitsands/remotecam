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
$configuredPin = getenv('CAMGUARD_PIN') ?: ($_ENV['CAMGUARD_PIN'] ?? null);
if ($configuredPin === null || trim($configuredPin) === '') {
    $configuredPin = '9080';
}

define('SECURITY_PIN', (string) $configuredPin);
define('APP_NAME', 'SandS CamGuard Remote');
define('DATA_DIR', __DIR__ . '/data');
define('PEER_DATA_FILE', DATA_DIR . '/peer_status.json');
define('LOGS_DATA_FILE', DATA_DIR . '/motion_logs.json');
define('SESSION_TIMEOUT_SECONDS', 1800);

// Ensure data directory exists
if (!file_exists(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}

// Hardening for PHP sessions
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
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
    if (!(isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true)) {
        return false;
    }

    $lastSeen = $_SESSION['last_activity'] ?? time();
    if ((time() - $lastSeen) > SESSION_TIMEOUT_SECONDS) {
        session_unset();
        session_destroy();
        return false;
    }

    $_SESSION['last_activity'] = time();
    return true;
}

function loginRateLimitExceeded() {
    $attempts = $_SESSION['login_attempts'] ?? [];
    $now = time();

    $attempts = array_values(array_filter($attempts, static fn($timestamp) => ($now - (int)$timestamp) < 300));
    $_SESSION['login_attempts'] = $attempts;

    return count($attempts) >= 5;
}

function recordFailedLoginAttempt() {
    $attempts = $_SESSION['login_attempts'] ?? [];
    $attempts[] = time();
    $_SESSION['login_attempts'] = array_values(array_filter($attempts, static fn($timestamp) => (time() - (int)$timestamp) < 300));
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
