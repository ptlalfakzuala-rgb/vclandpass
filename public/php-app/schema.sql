-- =========================================================================
-- Village Council Land Pass Management System
-- Relational MySQL Schema for PHP, HTML & CSS Web Hosting
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- Zero JavaScript / Zero Firebase Required
-- =========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------------
-- Table: villages
-- Stores Village Council Office particulars, prefixes, and starting numbers
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `villages` (
  `id` VARCHAR(100) NOT NULL,
  `village_name` VARCHAR(255) NOT NULL,
  `block_name` VARCHAR(255) DEFAULT '',
  `district_name` VARCHAR(255) DEFAULT 'Mizoram',
  `state_name` VARCHAR(255) DEFAULT 'Mizoram',
  `pin_code` VARCHAR(20) DEFAULT '',
  `huan_ram_prefix` VARCHAR(50) DEFAULT 'MZ-05-SPH-HR-',
  `in_hmun_prefix` VARCHAR(50) DEFAULT 'MZ-05-SPH-IH-',
  `starting_pass_number` INT DEFAULT 1001,
  `starting_huan_ram_number` INT DEFAULT 1001,
  `starting_in_hmun_number` INT DEFAULT 1001,
  `logo_url` MEDIUMTEXT DEFAULT NULL,
  `emblem_logo_url` MEDIUMTEXT DEFAULT NULL,
  `conditions_and_terms` MEDIUMTEXT DEFAULT NULL,
  `president_name` VARCHAR(255) DEFAULT '',
  `secretary_name` VARCHAR(255) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_village_name` (`village_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Table: users
-- Stores Village Council Secretaries and Authority Admin accounts
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `uid` VARCHAR(100) NOT NULL,
  `username` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(50) DEFAULT '',
  `village_id` VARCHAR(100) DEFAULT NULL,
  `village_name` VARCHAR(255) DEFAULT '',
  `user_type` ENUM('secretary', 'authority', 'admin') DEFAULT 'secretary',
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  `payment_screenshot_url` MEDIUMTEXT DEFAULT NULL,
  `profile_photo_url` MEDIUMTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `approved_at` DATETIME DEFAULT NULL,
  `approved_by` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `idx_username` (`username`),
  INDEX `idx_status` (`status`),
  INDEX `idx_village` (`village_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Table: land_passes
-- Stores official Land Pass Certificates (Huan Ram & In Hmun)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `land_passes` (
  `id` VARCHAR(100) NOT NULL,
  `pass_number` VARCHAR(100) NOT NULL,
  `pass_type` ENUM('huan_ram', 'in_hmun') NOT NULL,
  `owner_name` VARCHAR(255) NOT NULL,
  `parent_name` VARCHAR(255) DEFAULT '',
  `contact_number` VARCHAR(50) DEFAULT '',
  `location_address` TEXT DEFAULT NULL,
  `location_coordinates` VARCHAR(100) DEFAULT '',
  `village_id` VARCHAR(100) NOT NULL,
  `village_name` VARCHAR(255) DEFAULT '',
  `area_size` VARCHAR(150) DEFAULT '',
  `boundary_north` TEXT DEFAULT NULL,
  `boundary_east` TEXT DEFAULT NULL,
  `boundary_west` TEXT DEFAULT NULL,
  `boundary_south` TEXT DEFAULT NULL,
  `issue_date` DATE NOT NULL,
  `president_signatory` VARCHAR(255) DEFAULT '',
  `secretary_signatory` VARCHAR(255) DEFAULT '',
  `notes` TEXT DEFAULT NULL,
  `created_by` VARCHAR(100) DEFAULT 'system',
  `approval_status` ENUM('live', 'pending_approval', 'revoked') DEFAULT 'live',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_pass_number` (`pass_number`),
  INDEX `idx_village_pass` (`village_id`),
  INDEX `idx_owner` (`owner_name`),
  INDEX `idx_pass_type` (`pass_type`),
  INDEX `idx_approval` (`approval_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Table: audit_logs
-- Immutable Security and Activity Logs
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(100) NOT NULL,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `action` VARCHAR(100) NOT NULL,
  `target_id` VARCHAR(100) DEFAULT '',
  `target_name` VARCHAR(255) DEFAULT '',
  `performed_by` VARCHAR(255) NOT NULL,
  `details` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_timestamp` (`timestamp`),
  INDEX `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Initial Seed Data
-- -------------------------------------------------------------------------
-- Default Village Council: Saiphai Village Council
INSERT INTO `villages` (`id`, `village_name`, `block_name`, `district_name`, `state_name`, `pin_code`, `huan_ram_prefix`, `in_hmun_prefix`, `starting_pass_number`, `starting_huan_ram_number`, `starting_in_hmun_number`, `conditions_and_terms`, `president_name`, `secretary_name`)
VALUES (
  'village_saiphai_default',
  'SAIPHAI VILLAGE COUNCIL',
  'Bilkhawthlir RD Block',
  'Kolasib District',
  'Mizoram',
  '796091',
  'MZ-05-SPH-HR-',
  'MZ-05-SPH-IH-',
  1001,
  1001,
  1001,
  'CONDITIONS & RESTRICTION:\n1. Huan ram / In hmun hi ramri ziah anga pek a ni a.\n2. An ri-te inkar chin a huam ang.\n3. Pekni atanga kum thum (3) chhungin a enkawlin kut a thlak ngei tur a ni.\n4. Thlai phun lova, pass ringawt a nih chuan cancel theih a ni ang.\n5. VC ten tul bik thil ah an cancel thei ang.\n6. Vantlang leh sawrkar pawimawh ah a tul angin zangnadawmna pe lo in hman theih a ni ang.',
  'President, Saiphai VC',
  'Secretary, Saiphai VC'
) ON DUPLICATE KEY UPDATE `village_name`=VALUES(`village_name`);

-- Default Authority Admin (Password: 785392 or admin123)
-- Password hash for 'admin123' using password_hash('admin123', PASSWORD_BCRYPT)
INSERT INTO `users` (`uid`, `username`, `password_hash`, `display_name`, `phone_number`, `village_id`, `village_name`, `user_type`, `status`)
VALUES (
  'user_admin_001',
  'authority',
  '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeoV19V9wS9x.E3y1Zt9XmK4Z5d2h8mTe',
  'Full Authority Administrator',
  '7005504074',
  'village_saiphai_default',
  'SAIPHAI VILLAGE COUNCIL',
  'authority',
  'approved'
) ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- Default Secretary Account (Username: secretary, Password: password123)
-- Password hash for 'password123'
INSERT INTO `users` (`uid`, `username`, `password_hash`, `display_name`, `phone_number`, `village_id`, `village_name`, `user_type`, `status`)
VALUES (
  'user_sec_001',
  'secretary',
  '$2y$10$w4Bq5GqgT4R9P8yM3r9AieF8Z4oH3k6E2x7W1v9U4q8L0p5N6m7S2',
  'C. Lalramnghaka (Secretary)',
  '9862000000',
  'village_saiphai_default',
  'SAIPHAI VILLAGE COUNCIL',
  'secretary',
  'approved'
) ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- Sample Land Passes
INSERT INTO `land_passes` (`id`, `pass_number`, `pass_type`, `owner_name`, `parent_name`, `contact_number`, `location_address`, `village_id`, `village_name`, `area_size`, `boundary_north`, `boundary_east`, `boundary_west`, `boundary_south`, `issue_date`, `created_by`, `approval_status`)
VALUES 
(
  'pass_sample_01',
  'MZ-05-SPH-HR-1001',
  'huan_ram',
  'Lalhmangaiha',
  'Rohlira (L)',
  '9862123456',
  'Venglai ram, Saiphai',
  'village_saiphai_default',
  'SAIPHAI VILLAGE COUNCIL',
  '2.5 Bighas',
  'Kawngpui lian',
  'Lalthanzama huan',
  'Puia ramri',
  'Tiau lui kama ram',
  '2026-01-15',
  'user_sec_001',
  'live'
),
(
  'pass_sample_02',
  'MZ-05-SPH-IH-1001',
  'in_hmun',
  'Zonunsanga',
  'Chawngzika',
  '9862987654',
  'Dam Veng, Saiphai',
  'village_saiphai_default',
  'SAIPHAI VILLAGE COUNCIL',
  '60 x 80 feet',
  'Kawngpui',
  'Lalbiaka in hmun',
  'Zamliana in hmun',
  'Sikul ramri',
  '2026-02-10',
  'user_sec_001',
  'live'
) ON DUPLICATE KEY UPDATE `pass_number`=VALUES(`pass_number`);

SET FOREIGN_KEY_CHECKS = 1;
