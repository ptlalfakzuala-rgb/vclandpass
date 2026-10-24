-- =========================================================================
-- Village Council Land Pass Management System
-- Relational MySQL Schema for PHP Backend Storage
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.2+
-- =========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------------
-- Table: villages
-- Stores Village Council office profile, logos, prefixes, and starting numbers
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `villages` (
  `id` VARCHAR(100) NOT NULL,
  `village_name` VARCHAR(255) NOT NULL,
  `block_name` VARCHAR(255) DEFAULT '',
  `district_name` VARCHAR(255) DEFAULT 'Mizoram',
  `state_name` VARCHAR(255) DEFAULT 'Mizoram',
  `pin_code` VARCHAR(20) DEFAULT '',
  `huan_ram_prefix` VARCHAR(50) DEFAULT 'MZ-VC-HR-',
  `in_hmun_prefix` VARCHAR(50) DEFAULT 'MZ-VC-IH-',
  `starting_pass_number` INT DEFAULT 1001,
  `starting_huan_ram_number` INT DEFAULT 1001,
  `starting_in_hmun_number` INT DEFAULT 1001,
  `logo_url` MEDIUMTEXT DEFAULT NULL,
  `emblem_logo_url` MEDIUMTEXT DEFAULT NULL,
  `conditions_and_terms` MEDIUMTEXT DEFAULT NULL,
  `president_name` VARCHAR(255) DEFAULT '',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_village_name` (`village_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Table: users
-- Stores registered secretaries, authority users, payment proofs, and approval status
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `uid` VARCHAR(100) NOT NULL,
  `username` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `display_name` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(50) DEFAULT '',
  `village_id` VARCHAR(100) DEFAULT NULL,
  `village_name` VARCHAR(255) DEFAULT '',
  `user_type` ENUM('secretary', 'authority', 'admin') DEFAULT 'secretary',
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `payment_screenshot_url` MEDIUMTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `approved_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `idx_username` (`username`),
  INDEX `idx_status` (`status`),
  INDEX `idx_user_village` (`village_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Table: land_passes
-- Stores official Land Pass certificates, boundary survey details, and status
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `land_passes` (
  `id` VARCHAR(100) NOT NULL,
  `pass_number` VARCHAR(100) NOT NULL,
  `pass_type` ENUM('huan_ram', 'in_hmun') NOT NULL,
  `owner_name` VARCHAR(255) NOT NULL,
  `parent_name` VARCHAR(255) DEFAULT '',
  `contact_number` VARCHAR(50) DEFAULT '',
  `location_address` TEXT DEFAULT NULL,
  `village_id` VARCHAR(100) NOT NULL,
  `village_name` VARCHAR(255) DEFAULT '',
  `area_dimension` VARCHAR(150) DEFAULT '',
  `boundary_north` TEXT DEFAULT NULL,
  `boundary_east` TEXT DEFAULT NULL,
  `boundary_west` TEXT DEFAULT NULL,
  `boundary_south` TEXT DEFAULT NULL,
  `issue_date` DATE NOT NULL,
  `valid_upto` DATE DEFAULT NULL,
  `created_by` VARCHAR(100) DEFAULT 'system',
  `approval_status` ENUM('live', 'pending_approval', 'revoked') DEFAULT 'pending_approval',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_pass_number` (`pass_number`),
  INDEX `idx_village_pass` (`village_id`),
  INDEX `idx_owner` (`owner_name`),
  INDEX `idx_pass_type` (`pass_type`),
  INDEX `idx_approval` (`approval_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Table: audit_logs
-- Stores immutable audit trails for compliance and security
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

SET FOREIGN_KEY_CHECKS = 1;
