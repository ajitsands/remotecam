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
// The PIN is REQUIRED. Fail CLOSED: never fall back to a hardcoded/default PIN.
// It is detected, in order, from:
//   1. getenv('CAMGUARD_PIN') or $_ENV['CAMGUARD_PIN']      (server env var / .env)
//   2. $_SERVER['CAMGUARD_PIN']                              (Apache/LiteSpeed .htaccess SetEnv)
//   3. data/pin.php                                        (git-ignored file - works on any host)
$configuredPin = (string) (getenv('CAMGUARD_PIN') ?: ($_ENV['CAMGUARD_PIN'] ?? $_SERVER['CAMGUARD_PIN'] ?? ''));

if ($configuredPin === '') {
    $localPinFile = __DIR__ . '/data/pin.php';
    if (is_file($localPinFile)) {
        define('APP_PIN_INCLUDE', 1); // guards pin.php from direct web access
        $pinFromLocal = @include $localPinFile;
        if (is_string($pinFromLocal) && trim($pinFromLocal) !== '') {
            $configuredPin = trim($pinFromLocal);
        }
    }
}

if ($configuredPin === '') {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Configuration error: CAMGUARD_PIN is not set. Add it via .htaccess (SetEnv CAMGUARD_PIN XXXXX) or create data/pin.php. Refusing to start.');
}

define('SECURITY_PIN', $configuredPin);
define('APP_NAME', 'SandS CamGuard Remote');
define('APP_VERSION', '1.3.0');
define('DATA_DIR', __DIR__ . '/data');
define('PEER_DATA_FILE', DATA_DIR . '/peer_status.json');
define('LOGS_DATA_FILE', DATA_DIR . '/motion_logs.json');
define('LOGIN_RATE_FILE', DATA_DIR . '/login_attempts.json');
define('SESSION_TIMEOUT_SECONDS', 1800);
define('LOG_RETENTION_SECONDS', 7 * 24 * 3600);      // Events older than 7 days are purged
define('SNAPSHOT_RETENTION_SECONDS', 24 * 3600);     // Snapshots auto-expire after 24 hours

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

// Force HTTPS in production (skipped for the built-in PHP dev server; honors X-Forwarded-Proto behind proxies)
$isHttpsRequest = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https');
if (!$isHttpsRequest && PHP_SAPI !== 'cli-server') {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $uri  = $_SERVER['REQUEST_URI'] ?? '/';
    if ($host !== '') {
        header('Location: https://' . $host . $uri);
        exit;
    }
}

// JSON Output Helper
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
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
    // Layer 1: per-session attempt counter (existing behaviour)
    $attempts = $_SESSION['login_attempts'] ?? [];
    $attempts = array_values(array_filter($attempts, static fn($timestamp) => (time() - (int)$timestamp) < 300));
    $_SESSION['login_attempts'] = $attempts;
    $sessionBlocked = count($attempts) >= 5;

    // Layer 2: per-IP counter stored server-side (cannot be bypassed by clearing cookies)
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ipAttempts = readIpRateData()[$ip] ?? [];

    return $sessionBlocked || count($ipAttempts) >= 5;
}

function recordFailedLoginAttempt() {
    // Per-session counter (defense in depth)
    $attempts = $_SESSION['login_attempts'] ?? [];
    $attempts[] = time();
    $_SESSION['login_attempts'] = array_values(array_filter($attempts, static fn($timestamp) => (time() - (int)$timestamp) < 300));

    // Per-IP counter stored in server-side JSON (survives cookie clearing)
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $all = readIpRateData();
    $all[$ip][] = time();
    if (count($all) > 10000) {
        $all = array_slice($all, -10000, null, true); // abuse guard
    }
    writeJsonFile(LOGIN_RATE_FILE, $all);

    auditSecurityLog('FAILED LOGIN attempt');
}

// Read + prune the per-IP login attempt store
function readIpRateData() {
    $data = json_decode(@file_get_contents(LOGIN_RATE_FILE), true);
    return is_array($data) ? pruneIpRateData($data) : [];
}

// Only keep attempts from the last 5 minutes to bound the file size
function pruneIpRateData($all) {
    $cutoff = time() - 300;
    $pruned = [];
    foreach ($all as $ip => $times) {
        if (!is_array($times)) { continue; }
        $recent = array_values(array_filter($times, static fn($t) => ((int)$t) >= $cutoff));
        if (count($recent) > 0) {
            $pruned[$ip] = $recent;
        }
    }
    return $pruned;
}

// Atomic-ish JSON file writer with file locking
function writeJsonFile($path, $data) {
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $json = json_encode($data);
    if ($json === false) {
        return false;
    }
    $fp = @fopen($path, 'c');
    if (!$fp) {
        return false;
    }
    $ok = false;
    if (flock($fp, LOCK_EX)) {
        $ok = (ftruncate($fp, 0) !== false) && (fwrite($fp, $json) !== false);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
    return $ok;
}

// Append a line to the server-side security audit log
function auditSecurityLog($message) {
    $line = date('Y-m-d H:i:s') . ' | ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . ' | ' . $message . PHP_EOL;
    @file_put_contents(DATA_DIR . '/security.log', $line, FILE_APPEND | LOCK_EX);
}

// Basic hardening headers for HTML pages
function sendSecurityHeaders() {
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
}

// Apply retention policy to motion logs (drops old events, strips expired snapshots)
function pruneExpiredLogs($logs) {
    $now = time();
    $result = [];
    foreach ($logs as $log) {
        if (!is_array($log)) { continue; }
        $ts = isset($log['ts']) ? (int)$log['ts'] : (strtotime($log['timestamp'] ?? '') ?: $now);
        if (($now - $ts) > LOG_RETENTION_SECONDS) { continue; } // drop old events
        if (!empty($log['snapshot']) && ($now - $ts) > SNAPSHOT_RETENTION_SECONDS) {
            $log['snapshot'] = null;             // strip expired snapshot
            $log['has_snapshot'] = false;
        }
        $result[] = $log;
    }
    return $result;
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
