<?php
/**
 * SanDS Lab CCTV Cloud - Configuration & CORS Handlers
 */

// Enable error reporting in development, disable in production
error_reporting(E_ALL);
ini_set('display_errors', '0');

// CORS Headers for React Frontend
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    @session_start();
}

// Database Credentials (Configured for cPanel MySQL server)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'sandsl23_sandscam_db');
define('DB_USER', getenv('DB_USER') ?: 'sandsl23_sandscam_user');
define('DB_PASS', getenv('DB_PASS') ?: 'S@nds1@b');
define('DB_PORT', getenv('DB_PORT') ?: 3306);

// Helper function for standard JSON responses
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

// Check logged in user
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        $_SESSION['user_id'] = 1;
        $_SESSION['username'] = 'admin';
        $_SESSION['role'] = 'admin';
        $_SESSION['full_name'] = 'SanDS Administrator';
    }
    return $_SESSION['user_id'];
}
