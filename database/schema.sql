-- =========================================================
-- SanDS Lab CCTV Cloud - Database Schema (MySQL / MariaDB)
-- Multi-Camera Management & Authentication System
-- =========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) DEFAULT 'Operator',
    `role` ENUM('superadmin', 'admin', 'operator', 'viewer') DEFAULT 'admin',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_login` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Cameras Table
CREATE TABLE IF NOT EXISTS `cameras` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(100) DEFAULT 'Main Gate',
    `stream_key` VARCHAR(100) NOT NULL,
    `server_host` VARCHAR(255) NOT NULL DEFAULT 'camera.sandslab.com',
    `rtmp_port` INT DEFAULT 1935,
    `webrtc_port` INT DEFAULT 8889,
    `hls_port` INT DEFAULT 8888,
    `resolution` VARCHAR(30) DEFAULT '1080p',
    `camera_type` ENUM('rtmp', 'onvif', 'rtsp', 'webrtc') DEFAULT 'rtmp',
    `onvif_host` VARCHAR(255) NULL,
    `onvif_port` INT DEFAULT 80,
    `onvif_username` VARCHAR(100) NULL,
    `onvif_password` VARCHAR(255) NULL,
    `rtsp_port` INT DEFAULT 554,
    `rtsp_path` VARCHAR(255) NULL,
    `onvif_profile` VARCHAR(100) NULL,
    `ptz_enabled` TINYINT(1) DEFAULT 0,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `is_favorite` TINYINT(1) DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Snapshots / Event Logs Table
CREATE TABLE IF NOT EXISTS `camera_events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `camera_id` INT NOT NULL,
    `event_type` VARCHAR(50) DEFAULT 'Snapshot',
    `image_path` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`camera_id`) REFERENCES `cameras`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Super Admin User (Password: S@nds1@b)
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`)
VALUES (1, 'superadmin', 'superadmin@sandslab.com', '$2y$10$3D/mZFW/mN7dwIC./uBntOK7A5ATv60mnMWeaHac7b/z2ExIhSkV6', 'SaNDS Super Admin', 'superadmin');

-- Default Admin User (Password: admin123)
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`)
VALUES (2, 'admin', 'admin@sandslab.com', '$2y$10$23n6AcgfqeLItjmLCxpfuuO9rQSmeVb8OBfzzY/K4hYV7YgjwVKHm', 'SaNDS Administrator', 'admin');

-- Default Active Camera Sample
INSERT IGNORE INTO `cameras` (`id`, `user_id`, `name`, `location`, `stream_key`, `server_host`, `rtmp_port`, `webrtc_port`, `hls_port`, `resolution`, `status`)
VALUES (1, 1, '4G UNV Camera 1', 'Remote Site Alpha', 'camera1', 'camera.sandslab.com', 1935, 8889, 8888, '1080p', 'active');
