<?php
/**
 * SanDS Lab CCTV Cloud - Database Connection PDO Helper
 * Supports MySQL with graceful fallback & auto-table initialization
 */

require_once __DIR__ . '/config.php';

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    // Attempt MySQL connection first
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 3,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Fallback: If MySQL is not running locally (e.g., local test), use SQLite file in data dir
        $sqliteDir = __DIR__ . '/../data';
        if (!file_exists($sqliteDir)) {
            @mkdir($sqliteDir, 0755, true);
        }
        $sqlitePath = $sqliteDir . '/database.sqlite';
        $pdo = new PDO("sqlite:" . $sqlitePath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // Auto initialize tables in SQLite
        initializeSqliteTables($pdo);
        return $pdo;
    }
}

function initializeSqliteTables($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT DEFAULT 'Operator',
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        );

        CREATE TABLE IF NOT EXISTS cameras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            location TEXT DEFAULT 'Main Gate',
            stream_key TEXT NOT NULL,
            server_host TEXT NOT NULL DEFAULT 'earth.rechargingsolution.in',
            rtmp_port INTEGER DEFAULT 1935,
            webrtc_port INTEGER DEFAULT 8889,
            hls_port INTEGER DEFAULT 8888,
            resolution TEXT DEFAULT '1080p',
            status TEXT DEFAULT 'active',
            is_favorite INTEGER DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS camera_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id INTEGER NOT NULL,
            event_type TEXT DEFAULT 'Snapshot',
            image_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // Insert demo user and camera if empty
    $checkUser = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($checkUser == 0) {
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['admin', 'admin@sandslab.com', password_hash('admin123', PASSWORD_BCRYPT), 'SanDS Administrator', 'admin']);
        
        $userId = $pdo->lastInsertId();
        $stmtCam = $pdo->prepare("INSERT INTO cameras (user_id, name, location, stream_key, server_host, rtmp_port, webrtc_port, hls_port, resolution, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtCam->execute([$userId, '4G UNV Camera 1', 'Office Remote Node', 'camera1', 'camera.sandslab.com', 1935, 8889, 8888, '1080p', 'active']);
        $stmtCam->execute([$userId, '4G Warehouse Cam 2', 'Storage Area Beta', 'camera2', 'camera.sandslab.com', 1935, 8889, 8888, '1080p', 'active']);
    }
}
