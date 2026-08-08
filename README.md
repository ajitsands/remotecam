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
Open `config.php` and set your desired security PIN passcode:
```php
define('SECURITY_PIN', '1234'); // Change '1234' to your secret 4-6 digit code
```

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
