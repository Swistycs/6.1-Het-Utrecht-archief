SET NAMES utf8mb4;

CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(190) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin','editor') NOT NULL DEFAULT 'editor',
    failed_logins   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until    DATETIME NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE points (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title_nl      VARCHAR(150) NOT NULL,
    title_en      VARCHAR(150) NULL,
    text_nl       TEXT NOT NULL,
    text_en       TEXT NULL,
    time_start    DECIMAL(7,2) NOT NULL,
    time_end      DECIMAL(7,2) NOT NULL,
    lat           DECIMAL(9,6) NOT NULL,
    lng           DECIMAL(9,6) NOT NULL,
    sound         VARCHAR(100) NULL,
    sort_order    INT NOT NULL DEFAULT 0,
    is_published  TINYINT(1) NOT NULL DEFAULT 0,
    updated_by    INT NULL,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_points_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_points_time CHECK (time_end > time_start AND time_start >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE media (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    point_id    INT NOT NULL,
    file_path   VARCHAR(255) NOT NULL,
    alt_nl      VARCHAR(255) NOT NULL,
    alt_en      VARCHAR(255) NULL,
    caption_nl  VARCHAR(255) NULL,
    caption_en  VARCHAR(255) NULL,
    source      VARCHAR(255) NOT NULL,
    year        SMALLINT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_media_point FOREIGN KEY (point_id) REFERENCES points(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE route_track (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    video_time  DECIMAL(7,2) NOT NULL,
    lat         DECIMAL(9,6) NOT NULL,
    lng         DECIMAL(9,6) NOT NULL,
    INDEX idx_route_time (video_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
    setting_key  VARCHAR(50) PRIMARY KEY,
    value        TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
