<?php
/**
 * SanDS Lab CCTV Cloud - HTTPS Stream Relay & WHEP WebRTC Proxy
 * Bridges MediaMTX (127.0.0.1:8889 / earth.rechargingsolution.in:8889) to Browser
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$stream = preg_replace('/[^a-zA-Z0-9_\/-]/', '', $_GET['stream'] ?? 'camera1');
$host = preg_replace('/[^a-zA-Z0-9_.-]/', '', $_GET['host'] ?? 'earth.rechargingsolution.in');
$webrtcPort = (int)($_GET['webrtc_port'] ?? 8889);
$hlsPort = (int)($_GET['hls_port'] ?? 8888);

// 1. Embeddable WebRTC Player with Enhanced Standby / Offline UI
if ($action === 'player') {
    $targetUrl = "http://{$host}:{$webrtcPort}/live/{$stream}/";
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $safeHost = htmlspecialchars($host);
    $safeStream = htmlspecialchars($stream);
    $rtmpUrl = "rtmp://{$safeHost}:1935/live/{$safeStream}";

    if ($httpCode === 200 && !empty($html)) {
        header('Content-Type: text/html; charset=utf-8');
        
        // Point WHEP signaling directly to the camera node for ultra-low latency playback
        $directWhep = "http://{$host}:{$webrtcPort}/live/{$stream}/whep";
        $html = str_replace(
            "new URL('whep', window.location.href)",
            "new URL('{$directWhep}')",
            $html
        );

        // Inject the Standby information box & controls
        $customOverlay = <<<HTML
<style>
  #message { display: none !important; }
</style>
<div id="standby-box" style="position:fixed;inset:0;background:#090d16;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f8fafc;text-align:center;">
  <div style="max-width:390px;width:100%;background:rgba(15,23,42,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:22px;box-shadow:0 8px 24px rgba(0,0,0,0.5);">
    <div style="width:46px;height:46px;border-radius:50%;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;display:inline-flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px auto;">&#9888;</div>
    <h3 style="font-size:1.05rem;font-weight:700;margin-bottom:4px;color:#f8fafc;">Camera Stream Standby</h3>
    <p style="font-size:0.78rem;color:#94a3b8;line-height:1.45;margin-bottom:14px;">No camera broadcast detected. Stream is offline or awaiting video ingest.</p>
    
    <div style="background:rgba(2,6,23,0.7);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 12px;font-size:0.75rem;text-align:left;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:#64748b;font-weight:600;">Channel</span>
        <span style="color:#38bdf8;font-family:monospace;font-weight:700;">{$safeStream}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:#64748b;font-weight:600;">Media Node</span>
        <span style="color:#cbd5e1;font-family:monospace;">{$safeHost}:{$webrtcPort}</span>
      </div>
      <div style="border-top:1px dashed rgba(255,255,255,0.08);padding-top:6px;margin-top:6px;">
        <div style="font-size:0.66rem;color:#64748b;text-transform:uppercase;margin-bottom:2px;">RTMP Ingest Address</div>
        <div style="color:#38bdf8;font-family:monospace;font-size:0.74rem;word-break:break-all;">{$rtmpUrl}</div>
      </div>
    </div>

    <div style="display:flex;gap:8px;justify-content:center;">
      <button onclick="retryNow()" style="padding:7px 16px;border-radius:6px;background:#0284c7;color:#fff;border:none;font-size:0.8rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">&#8635; Retry Stream</button>
      <button onclick="copyRtmp()" id="copy-btn" style="padding:7px 14px;border-radius:6px;background:rgba(30,41,59,0.9);color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);font-size:0.8rem;cursor:pointer;">Copy RTMP</button>
    </div>
  </div>
</div>

<script>
(function() {
  var box = document.getElementById('standby-box');
  var videoEl = document.getElementById('video');
  var msgEl = document.getElementById('message');

  window.retryNow = function() {
    window.location.reload();
  };

  window.copyRtmp = function() {
    navigator.clipboard.writeText('{$rtmpUrl}').then(function() {
      var btn = document.getElementById('copy-btn');
      if (btn) {
        btn.innerText = 'Copied!';
        setTimeout(function() { btn.innerText = 'Copy RTMP'; }, 2000);
      }
    });
  };

  function updateState() {
    if (videoEl && (videoEl.videoWidth > 0 || videoEl.currentTime > 0)) {
      box.style.display = 'none';
      return;
    }
    var txt = (msgEl ? (msgEl.innerText || msgEl.textContent || '') : '').trim();
    if (txt && (txt.indexOf('not found') !== -1 || txt.indexOf('retrying') !== -1 || txt.indexOf('Error') !== -1 || txt.indexOf('closed') !== -1)) {
      box.style.display = 'flex';
    } else if (!txt) {
      box.style.display = 'none';
    }
  }

  if (msgEl) {
    var obs = new MutationObserver(updateState);
    obs.observe(msgEl, { childList: true, characterData: true, subtree: true });
  }

  if (videoEl) {
    videoEl.addEventListener('playing', function() {
      box.style.display = 'none';
    });
    videoEl.addEventListener('timeupdate', updateState);
  }

  setInterval(updateState, 1500);
  updateState();
})();
</script>
HTML;

        $html = str_replace('</body>', $customOverlay . '</body>', $html);
        echo $html;
        exit;
    }

    // Fallback if target server host is completely offline or unreachable
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Camera Standby</title>
      <style>
        body { background:#090d16; color:#94a3b8; font-family:-apple-system,BlinkMacSystemFont,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; margin:0; padding:16px; box-sizing:border-box; }
        .card { max-width:390px; width:100%; background:rgba(15,23,42,0.95); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:22px; text-align:center; }
        .icon { width:46px; height:46px; border-radius:50%; background:rgba(245,158,11,0.12); color:#f59e0b; display:inline-flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:12px; }
        h3 { color:#f8fafc; font-size:1.05rem; font-weight:700; margin-bottom:4px; }
        p { font-size:0.78rem; line-height:1.45; color:#94a3b8; margin-bottom:14px; }
        .info { background:rgba(2,6,23,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px 12px; font-size:0.75rem; text-align:left; margin-bottom:14px; }
        .row { display:flex; justify-content:space-between; margin-bottom:6px; }
        .btn { padding:7px 16px; border-radius:6px; background:#0284c7; color:#fff; border:none; font-size:0.8rem; font-weight:600; cursor:pointer; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">&#9888;</div>
        <h3>Camera Stream Standby</h3>
        <p>Target camera server is offline or unreachable.</p>
        <div class="info">
          <div class="row"><span style="color:#64748b">Channel</span><span style="color:#38bdf8;font-family:monospace;font-weight:700"><?php echo $safeStream; ?></span></div>
          <div class="row"><span style="color:#64748b">Media Node</span><span style="color:#cbd5e1;font-family:monospace"><?php echo $safeHost . ':' . $webrtcPort; ?></span></div>
          <div style="border-top:1px dashed rgba(255,255,255,0.08);padding-top:6px;margin-top:6px;">
            <div style="font-size:0.66rem;color:#64748b;text-transform:uppercase;margin-bottom:2px;">RTMP Ingest Address</div>
            <div style="color:#38bdf8;font-family:monospace;font-size:0.74rem;word-break:break-all;"><?php echo $rtmpUrl; ?></div>
          </div>
        </div>
        <button class="btn" onclick="window.location.reload()">&#8635; Retry Stream</button>
      </div>
    </body>
    </html>
    <?php
    exit;
}

// 2. WHEP WebRTC SDP Signaling Proxy (Fallback if required)
if ($action === 'whep') {
    $method = $_SERVER['REQUEST_METHOD'];
    $subpath = $_GET['subpath'] ?? "/live/{$stream}/whep";
    if (strpos($subpath, '/') !== 0) $subpath = '/' . $subpath;
    $subpath = preg_replace('/[^a-zA-Z0-9_\/.-]/', '', $subpath);

    $targetUrl = "http://{$host}:{$webrtcPort}{$subpath}";
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);

    $reqHeaders = [];
    if (isset($_SERVER['CONTENT_TYPE']) && !empty($_SERVER['CONTENT_TYPE'])) {
        $reqHeaders[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
    }
    if (isset($_SERVER['HTTP_IF_MATCH']) && !empty($_SERVER['HTTP_IF_MATCH'])) {
        $reqHeaders[] = 'If-Match: ' . $_SERVER['HTTP_IF_MATCH'];
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);

    if ($method === 'POST' || $method === 'PATCH' || $method === 'PUT') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    if ($response === false) {
        sendJsonResponse(['status' => 'error', 'message' => 'Connection failed'], 502);
    }

    http_response_code($httpCode);
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: OPTIONS, GET, POST, PATCH, DELETE');
    echo substr($response, $headerSize);
    exit;
}

// 3. HLS Proxy
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
