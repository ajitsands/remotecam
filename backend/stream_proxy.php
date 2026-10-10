<?php
/**
 * SanDS Lab CCTV Cloud - HTTPS Stream Relay & WHEP WebRTC Proxy
 * Bridges MediaMTX (127.0.0.1:8889 / 8888) to Browser over Pure HTTPS
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$stream = preg_replace('/[^a-zA-Z0-9_\/-]/', '', $_GET['stream'] ?? 'camera1');
$host = preg_replace('/[^a-zA-Z0-9_.-]/', '', $_GET['host'] ?? '127.0.0.1');
$webrtcPort = (int)($_GET['webrtc_port'] ?? 8889);
$hlsPort = (int)($_GET['hls_port'] ?? 8888);

// 1. WHEP WebRTC SDP Signaling Proxy (Enables 100% HTTPS WebRTC playback)
if ($action === 'whep') {
    $sdpOffer = file_get_contents('php://input');
    
    $ch = curl_init("http://{$host}:{$webrtcPort}/live/{$stream}/whep");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $sdpOffer);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/sdp',
        'User-Agent: SanDS-CCTV-Proxy/1.0'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);

    $answerSdp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300 && !empty($answerSdp)) {
        header('Content-Type: application/sdp');
        http_response_code(200);
        echo $answerSdp;
        exit;
    }

    sendJsonResponse([
        'status' => 'error',
        'message' => 'Camera stream offline or WHEP not ready (' . ($curlErr ?: "HTTP $httpCode") . ')',
        'code' => $httpCode
    ], 502);
}

// 2. HLS Playlist & Video Chunk Proxy (.m3u8 / .ts)
if ($action === 'hls') {
    $file = $_GET['file'] ?? "live/{$stream}/index.m3u8";
    $file = preg_replace('/[^a-zA-Z0-9_\/.-]/', '', $file);

    $ch = curl_init("http://{$host}:{$hlsPort}/{$file}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    $content = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($httpCode === 200 && !empty($content)) {
        if (strpos($file, '.m3u8') !== false) {
            header('Content-Type: application/vnd.apple.mpegurl');
            // Rewrite segment paths to proxy through stream_proxy.php
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
