<?php
/**
 * SanDS Lab CCTV Cloud - Authentication API
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';
$pdo = getDbConnection();

if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $usernameOrEmail = trim($data['username'] ?? '');
    $password = (string)($data['password'] ?? '');

    if (empty($usernameOrEmail) || empty($password)) {
        sendJsonResponse(['status' => 'error', 'message' => 'Username/Email and Password are required.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1");
    $stmt->execute([$usernameOrEmail, $usernameOrEmail]);
    $user = $stmt->fetch();

    // Auto-seed or update default superadmin & admin if empty or matching default password
    if (!$user && $usernameOrEmail === 'superadmin' && $password === 'S@nds1@b') {
        $hash = password_hash('S@nds1@b', PASSWORD_BCRYPT);
        $insert = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name, role) VALUES ('superadmin', 'superadmin@sandslab.com', ?, 'SaNDS Super Admin', 'superadmin')");
        $insert->execute([$hash]);
        $stmt->execute(['superadmin', 'superadmin']);
        $user = $stmt->fetch();
    } elseif ($user && $user['username'] === 'superadmin' && $password === 'S@nds1@b' && !password_verify($password, $user['password_hash'])) {
        $hash = password_hash('S@nds1@b', PASSWORD_BCRYPT);
        $update = $pdo->prepare("UPDATE users SET password_hash = ?, role = 'superadmin' WHERE id = ?");
        $update->execute([$hash, $user['id']]);
        $user['password_hash'] = $hash;
        $user['role'] = 'superadmin';
    } elseif (!$user && $usernameOrEmail === 'admin' && $password === 'admin123') {
        $hash = password_hash('admin123', PASSWORD_BCRYPT);
        $insert = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name, role) VALUES ('admin', 'admin@sandslab.com', ?, 'SaNDS Administrator', 'admin')");
        $insert->execute([$hash]);
        $stmt->execute(['admin', 'admin']);
        $user = $stmt->fetch();
    } elseif ($user && $user['username'] === 'admin' && $password === 'admin123' && !password_verify($password, $user['password_hash'])) {
        // Fix hash if imported with outdated hash
        $hash = password_hash('admin123', PASSWORD_BCRYPT);
        $update = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $update->execute([$hash, $user['id']]);
        $user['password_hash'] = $hash;
    }

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];

        // Update last login
        $updateStmt = $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
        $updateStmt->execute([$user['id']]);

        unset($user['password_hash']);
        sendJsonResponse([
            'status' => 'success',
            'message' => 'Login successful',
            'user' => $user
        ]);
    }

    sendJsonResponse(['status' => 'error', 'message' => 'Invalid username or password.'], 401);
}

if ($action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = (string)($data['password'] ?? '');
    $fullName = trim($data['full_name'] ?? $username);

    if (empty($username) || empty($email) || empty($password)) {
        sendJsonResponse(['status' => 'error', 'message' => 'All fields are required.'], 400);
    }

    if (strlen($password) < 6) {
        sendJsonResponse(['status' => 'error', 'message' => 'Password must be at least 6 characters.'], 400);
    }

    // Check existing
    $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1");
    $stmtCheck->execute([$username, $email]);
    if ($stmtCheck->fetch()) {
        sendJsonResponse(['status' => 'error', 'message' => 'Username or Email is already registered.'], 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, 'operator')");
    $stmt->execute([$username, $email, $hash, $fullName]);

    $userId = $pdo->lastInsertId();
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['role'] = 'operator';
    $_SESSION['full_name'] = $fullName;

    sendJsonResponse([
        'status' => 'success',
        'message' => 'Account registered successfully',
        'user' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email,
            'full_name' => $fullName,
            'role' => 'operator'
        ]
    ]);
}

if ($action === 'me') {
    $userId = getCurrentUserId();
    if (!$userId) {
        sendJsonResponse(['status' => 'unauthenticated', 'user' => null]);
    }

    $stmt = $pdo->prepare("SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if ($user) {
        sendJsonResponse(['status' => 'success', 'user' => $user]);
    } else {
        session_destroy();
        sendJsonResponse(['status' => 'unauthenticated', 'user' => null]);
    }
}

if ($action === 'logout') {
    @session_destroy();
    sendJsonResponse(['status' => 'success', 'message' => 'Logged out successfully']);
}

sendJsonResponse(['status' => 'error', 'message' => 'Invalid action.'], 400);
