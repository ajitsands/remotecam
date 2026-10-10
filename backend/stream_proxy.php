<?php
/**
 * SanDS Lab CCTV Cloud - HTTPS Stream Relay & WHEP WebRTC Proxy
 * Bridges MediaMTX (127.0.0.1:8889 / earth.rechargingsolution.in:8889) to Browser over Pure HTTPS
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$stream = preg_replace('/[^a-zA-Z0-9_\/-]/', '', $_GET['stream'] ?? 'camera1');
$host = preg_replace('/[^a-zA-Z0-9_.-]/', '', $_GET['host'] ?? 'earth.rechargingsolution.in');
$webrtcPort = (int)($_GET['webrtc_port'] ?? 8889);
$hlsPort = (int)($_GET['hls_port'] ?? 8888);

// 1. Embeddable HTTPS WebRTC Player Proxy (Solves Mixed Content on HTTPS websites)
if ($action === 'player') {
    $targetUrl = "http://{$host}:{$webrtcPort}/live/{$stream}/";
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && !empty($html)) {
        header('Content-Type: text/html; charset=utf-8');
        
        // Rewrite signaling endpoint in MediaMTX HTML to go through this HTTPS proxy
        $whepProxyUrl = "stream_proxy.php?action=whep&host=" . urlencode($host) . "&stream=" . urlencode($stream) . "&webrtc_port=" . $webrtcPort . "&subpath=/live/" . urlencode($stream) . "/whep";
        
        $html = str_replace(
            "new URL('whep', window.location.href)",
            "new URL('{$whepProxyUrl}', window.location.href)",
            $html
        );

        echo $html;
        exit;
    }

    http_response_code(502);
    header('Content-Type: text/html; charset=utf-8');
    echo "<div style='display:flex;align-items:center;justify-content:center;height:100vh;background:#090d16;color:#94a3b8;font-family:sans-serif;'>";
    echo "<div><p style='color:#f8fafc;font-weight:600;'>Connecting to Live Camera Stream...</p><p style='font-size:12px;'>Target: {$host}:{$webrtcPort}/live/{$stream}</p></div>";
    echo "</div>";
    exit;
}

// 2. WHEP WebRTC SDP Signaling Proxy (Handles OPTIONS, POST, PATCH, DELETE)
if ($action === 'whep') {
    $method = $_SERVER['REQUEST_METHOD'];
    $subpath = $_GET['subpath'] ?? "/live/{$stream}/whep";
    
    if (strpos($subpath, '/') !== 0) {
        $subpath = '/' . $subpath;
    }
    $subpath = preg_replace('/[^a-zA-Z0-9_\/.-]/', '', $subpath);

    $targetUrl = "http://{$host}:{$webrtcPort}{$subpath}";
    
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

    $reqHeaders = [];
    if (isset($_SERVER['CONTENT_TYPE']) && !empty($_SERVER['CONTENT_TYPE'])) {
        $reqHeaders[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
    }
    if (isset($_SERVER['HTTP_IF_MATCH']) && !empty($_SERVER['HTTP_IF_MATCH'])) {
        $reqHeaders[] = 'If-Match: ' . $_SERVER['HTTP_IF_MATCH'];
    }
    $reqHeaders[] = 'User-Agent: SanDS-CCTV-Proxy/1.0';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);

    if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
        $input = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        sendJsonResponse(['status' => 'error', 'message' => 'Upstream stream connection error: ' . $curlErr], 502);
    }

    $rawHeaders = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);

    http_response_code($httpCode);

    // Forward relevant response headers
    $headerLines = explode("\r\n", $rawHeaders);
    foreach ($headerLines as $line) {
        if (stripos($line, 'Link:') === 0) {
            header($line);
        } elseif (stripos($line, 'Content-Type:') === 0) {
            header($line);
        } elseif (stripos($line, 'Location:') === 0) {
            $origLocation = trim(substr($line, 9));
            $proxiedLocation = "stream_proxy.php?action=whep&host=" . urlencode($host) . "&stream=" . urlencode($stream) . "&webrtc_port=" . $webrtcPort . "&subpath=" . urlencode($origLocation);
            header("Location: {$proxiedLocation}");
        }
    }

    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: OPTIONS, GET, POST, PATCH, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, If-Match, Authorization');
    header('Access-Control-Expose-Headers: Link, Location');

    echo $body;
    exit;
}

// 3. HLS Playlist & Video Chunk Proxy (.m3u8 / .ts)
if ($action === 'hls') {
    $file = $_GET['file'] ?? "live/{$stream}/index.m3u8";
    $file = preg_replace('/[^a-zA-Z0-9_\/.-]/', '', $file);

    $ch = curl_init("http://{$host}:{$hlsPort}/{$file}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    $content = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && !empty($content)) {
        if (strpos($file, '.m3u8') !== false) {
            header('Content-Type: application/vnd.apple.mpegurl');
            $content = preg_replace('/(segment_.*\.ts)/', 'stream_proxy.php?action=hls&host=' . urlencode($host) . '&hls_port=' . $hlsPort . '&file=live/' . $stream . '/$1', $content);
        } elseif (strpos($file, '.ts') !== false) {
            header('Content-Type: video/mp2t');
        }
        echo $content;
        exit;
    }

    sendJsonResponse(['status' => 'error', 'message' => 'HLS stream not found'], 404);
}

sendJsonResponse(['status' => 'error', 'message' => 'Invalid stream action'], 400);
