-- =========================================================================
-- DICO ERP - HRM: migrasi untuk mode MySQL
-- Cara pakai: phpMyAdmin -> pilih database "dico_community" -> tab SQL -> tempel semua -> Go
--
--  * Aman dijalankan berulang kali (IF NOT EXISTS).
--  * TIDAK menghapus data apa pun dan hanya menyentuh tabel milik HRM (hrm_*).
--  * Dibuat untuk MariaDB bawaan XAMPP (ADD COLUMN IF NOT EXISTS).
--  * Jangan import erp_modular_schema.sql untuk keperluan ini: file itu DROP semua tabel.
-- =========================================================================

SET NAMES utf8mb4;

-- 1) Tabel dasar (dilewati bila sudah ada dari skema modular) -------------

CREATE TABLE IF NOT EXISTS `hrm_employees` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL UNIQUE,
  `nik` VARCHAR(50) NOT NULL UNIQUE,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `departemen` VARCHAR(50) NOT NULL,
  `jabatan` VARCHAR(100) NOT NULL,
  `tgl_bergabung` DATE NOT NULL,
  `gaji_pokok` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('kontrak', 'tetap', 'magang') DEFAULT 'kontrak'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `hrm_leaves` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT UNSIGNED NOT NULL,
  `tipe_cuti` ENUM('tahunan', 'sakit', 'izin') NOT NULL,
  `tgl_mulai` DATE NOT NULL,
  `tgl_selesai` DATE NOT NULL,
  `alasan` TEXT,
  `status` ENUM('menunggu', 'disetujui', 'ditolak') DEFAULT 'menunggu',
  `disetujui_oleh` INT UNSIGNED NULL,
  FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) Kolom tambahan untuk halaman HRM -------------------------------------

ALTER TABLE `hrm_employees`
  MODIFY `departemen` VARCHAR(100) NOT NULL DEFAULT '',
  MODIFY `tgl_bergabung` DATE NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(150) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `no_telp` VARCHAR(20) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `status_aktif` ENUM('Aktif', 'Cuti', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at` DATETIME NULL DEFAULT NULL;

ALTER TABLE `hrm_leaves`
  ADD COLUMN IF NOT EXISTS `review_note` VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS `reviewed_at` DATETIME NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at` DATETIME NULL DEFAULT NULL;

-- 3) Tabel event & registrasi internal HRM (terpisah dari workshop modul Event)

CREATE TABLE IF NOT EXISTS `hrm_events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `event_date` DATE NOT NULL,
  `event_time` TIME NULL DEFAULT NULL,
  `location` VARCHAR(150) NOT NULL DEFAULT '',
  `category` VARCHAR(60) NOT NULL DEFAULT '',
  `status` ENUM('Aktif', 'Selesai') NOT NULL DEFAULT 'Aktif',
  `description` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL,
  KEY `idx_hrm_events_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `hrm_event_registrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT UNSIGNED NOT NULL,
  `participant_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `status` ENUM('Terdaftar', 'Hadir', 'Dibatalkan') NOT NULL DEFAULT 'Terdaftar',
  `registered_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL,
  UNIQUE KEY `uq_hrm_reg_event_email` (`event_id`, `email`),
  FOREIGN KEY (`event_id`) REFERENCES `hrm_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) OPSIONAL: contoh data event (hanya terisi bila tabel masih kosong) ------

INSERT INTO `hrm_events` (`title`, `event_date`, `status`, `description`)
SELECT t.`title`, t.`event_date`, t.`status`, t.`description` FROM (
  SELECT 'Pelatihan Komunikasi' AS `title`, '2026-10-15' AS `event_date`, 'Aktif' AS `status`, 'Pelatihan internal untuk meningkatkan komunikasi tim.' AS `description`
  UNION ALL
  SELECT 'Town Hall DICO', '2026-10-22', 'Aktif', 'Pertemuan bulanan dan pembaruan perusahaan.'
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `hrm_events`);

-- 5) Pemeriksaan: kedua perintah ini harus menampilkan kolom baru --------------
-- DESCRIBE hrm_employees;
-- SHOW TABLES LIKE 'hrm_%';