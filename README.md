# SandS CamGuard - Remote Laptop Webcam Viewer

A secure, high-performance remote webcam monitoring web application powered by **PHP, HTML5, JavaScript, and PeerJS (WebRTC)**.

Designed specifically for remote home monitoring of an office laptop camera over the internet.

---

## 🌟 Key Features

- 🔒 **PIN Authentication**: Secure login gate preventing unauthorized access to your webcam feed.
- ⚡ **Real-Time Low Latency WebRTC Video & Audio**: Direct peer-to-peer streaming powered by PeerJS.
- 🕶️ **Stealth Screen Mode**: Dim screen blackout mode so the office laptop stays unobtrusive while capturing.
- 🚨 **Canvas Motion Detection**: Automatic frame-by-frame movement tracking with snapshot alerts logged to the server.
- 📸 **Remote Snapshot & Download**: Capture instant high-resolution photo snapshots of who is sitting in front of your laptop.
- 🔊 **Live Office Audio Monitoring**: Listen to room audio with one-click Mute/Unmute control.

---

## 🚀 Deployment Instructions for `remote.sandslab.com`

### 1. Upload Project Files
Upload all files in this project directory to your web server (e.g., in a `/webcam` subdirectory):
- Upload to: `https://remote.sandslab.com/webcam/` (or root directory).

### 2. Configure Security PIN

The PIN is **required** — the app fails closed (shows the configuration error below and refuses to run) if it is not set. There is **no hardcoded default**. This is intentional.

Set the PIN **one** of these ways (first one found wins):

**Option A — `.htaccess` (recommended for cPanel / Apache / LiteSpeed):**
Add to the root `.htaccess` (replace `YOUR_SECRET_PIN`):
```apache
SetEnv CAMGUARD_PIN YOUR_SECRET_PIN
```

**Option B — Real environment variable (nginx / PHP-FPM / Docker / CLI):**
```bash
export CAMGUARD_PIN=YOUR_SECRET_PIN   # or set it in your FPM pool / Docker env
```

**Option C — git-ignored file (works on any host):**
Copy `data/pin.php.example` to `data/pin.php` and set your PIN inside:
```php
return 'YOUR_SECRET_PIN'; // <-- data/pin.php
```
`data/pin.php` is git-ignored and blocked from direct web access (guarded blank page if reached directly).

> ⚠️ **Troubleshooting:** If you see `Configuration error: CAMGUARD_PIN is not set. Refusing to start.` after a `git pull`, the PIN source was not found on the server yet. Do the **`.htaccess` `SetEnv`** line (option A) or the **`data/pin.php`** file (option C), then reload. If `SetEnv` doesn't take effect your PHP is likely running as FastCGI without env passthrough — use option C for those hosts.

### 3. Ensure File Permissions
Ensure the `data/` directory is writable by the PHP server so it can create `peer_status.json` and `motion_logs.json`:
```bash
chmod 755 data/
```

---

## 📖 How to Use

### Step 1: Set Up Office Laptop
1. On your office laptop, open browser to: `https://remote.sandslab.com/webcam/`
2. Enter your **Security PIN** to log in.
3. Click **"Launch Office Camera"**.
4. When prompted by the browser, click **Allow** for Camera and Microphone permissions.
5. *(Optional)* Click **"Stealth Mode"** to dim the laptop screen so it doesn't attract attention in the office.

### Step 2: Remote View from Home or Phone
1. At home or on your phone, open: `https://remote.sandslab.com/webcam/`
2. Enter your **Security PIN** to log in.
3. Click **"Open Live Stream Viewer"**.
4. Enjoy real-time live video & audio feed from your office laptop!

---

## 🛠️ Technology Stack
- **Backend**: PHP 8+ (REST API, Session Auth, Heartbeat Tracker)
- **Frontend**: HTML5, Vanilla CSS3 (Dark Glassmorphism), Modern ES6 JavaScript
- **Streaming**: WebRTC via PeerJS & Public STUN Servers
- **Detection**: HTML5 Canvas Pixel-Difference Motion Analysis
