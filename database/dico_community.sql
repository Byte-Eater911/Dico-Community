-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 24, 2026 at 02:08 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dico_community`
--

-- --------------------------------------------------------

--
-- Table structure for table `crm_customers`
--

CREATE TABLE `crm_customers` (
  `id` int(10) UNSIGNED NOT NULL,
  `nama` varchar(150) NOT NULL,
  `email` varchar(100) NOT NULL,
  `no_hp` varchar(30) NOT NULL,
  `instansi` varchar(150) DEFAULT NULL,
  `minat_produk` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `tipe` enum('lead','client','partner','alumni') DEFAULT 'lead',
  `status_prospek` enum('cold','warm','hot','deal','lost') DEFAULT 'cold',
  `sales_pic_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `crm_customers`
--

INSERT INTO `crm_customers` (`id`, `nama`, `email`, `no_hp`, `instansi`, `minat_produk`, `password_hash`, `foto_profil`, `tipe`, `status_prospek`, `sales_pic_id`, `created_at`) VALUES
(1, 'Bagus Putra', 'bagus123@gmail.com', '081234567890', 'Universitas Indraprasta PGRI', 'Workshop', '$2y$10$/x6PhB6.LtvpX1uevVLwauP7Kge8pvPBDralpt2AK3RALrTY/LFI6', NULL, 'lead', 'cold', NULL, '2026-10-11 17:24:38'),
(2, 'budi', 'budi@tes.com', '0887124190', 'Universitas Indraprasta PGRI', 'Workshop', '$2y$10$YjCjxasCX6M6XSxr6.MIN.qp4Z/K2m.Pq1Go9PrIeAdOcmKCWNDSi', NULL, 'lead', 'warm', NULL, '2026-10-13 07:50:33'),
(3, 'bagus', 'tes123@gmail.com', '084345677654', '', '', '$2y$10$5g8OlmVDrOaT2.Z9qSp4LOThUv4K8RIu0xYK7RqMnGbdrVnX9rqpy', NULL, 'lead', 'cold', NULL, '2026-10-19 23:26:16'),
(4, 'Bima', 'bima123@gmail.com', '089812345678', '', '', '$2y$10$8Zvm08E2GCB47q67W13epOMybr87OpvTOsVLcczxag3zBBZWAJhD.', NULL, 'lead', 'cold', NULL, '2026-11-09 23:18:32'),
(5, 'ernes', 'ernest123@test.com', '081122334455', '', '', '$2y$10$SyNdcV81t/k.RCDc1FGKk.JfHLImQA70S8zleqhbMcijnxT7YM.aS', NULL, 'lead', 'cold', NULL, '2026-11-16 08:57:12');

-- --------------------------------------------------------

--
-- Table structure for table `crm_interactions`
--

CREATE TABLE `crm_interactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `customer_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `tipe_kontak` enum('call','email','meeting','whatsapp') NOT NULL,
  `catatan` text NOT NULL,
  `tgl_interaksi` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `crm_interactions`
--

INSERT INTO `crm_interactions` (`id`, `customer_id`, `user_id`, `tipe_kontak`, `catatan`, `tgl_interaksi`) VALUES
(1, 1, 4, 'whatsapp', 'kenapa saya tidak bisa mendaftar', '2026-10-13 18:22:40');

-- --------------------------------------------------------

--
-- Table structure for table `event_registrations`
--

CREATE TABLE `event_registrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `workshop_id` int(10) UNSIGNED NOT NULL,
  `customer_id` int(10) UNSIGNED DEFAULT NULL,
  `nama_peserta` varchar(150) NOT NULL,
  `email_peserta` varchar(150) NOT NULL,
  `no_hp` varchar(30) DEFAULT NULL,
  `instansi` varchar(255) DEFAULT NULL,
  `jenis_pendaftar` varchar(100) DEFAULT NULL,
  `status_pembayaran` enum('menunggu','berhasil','batal') DEFAULT 'menunggu',
  `total_bayar` decimal(12,2) DEFAULT 0.00,
  `payment_proof` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_registrations`
--

INSERT INTO `event_registrations` (`id`, `workshop_id`, `customer_id`, `nama_peserta`, `email_peserta`, `no_hp`, `instansi`, `jenis_pendaftar`, `status_pembayaran`, `total_bayar`, `payment_proof`, `created_at`) VALUES
(1, 3, 1, 'Bagus Putra', 'bagus123@gmail.com', '081234567890', 'Unindra', 'Mahasiswa', 'berhasil', 50000.00, 'uploads/payment-proofs/payment_1_898cd465b5.webp', '2026-10-20 00:03:33'),
(4, 10, 1, 'Bagus Putra', 'bagus123@gmail.com', '081122334455', 'UBSI', 'Mahasiswa', 'berhasil', 50000.00, 'uploads/payment-proofs/payment_4_f8bce9022d.png', '2026-11-24 07:54:01'),
(5, 10, 4, 'Bima', 'bima123@gmail.com', '+62895639780401', 'Unindra', 'Mahasiswa', 'menunggu', 50000.00, NULL, '2026-11-24 08:01:29');

-- --------------------------------------------------------

--
-- Table structure for table `experts`
--

CREATE TABLE `experts` (
  `id` int(10) UNSIGNED NOT NULL,
  `expert_id` varchar(100) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `role` varchar(255) DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `foto_url` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `social_media` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`social_media`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `experts`
--

INSERT INTO `experts` (`id`, `expert_id`, `nama`, `role`, `skills`, `foto_url`, `bio`, `social_media`, `created_at`, `updated_at`) VALUES
(1, 'walim', 'Walim, M.Kom', 'Marketing Komunikasi', '[\"Digital Marketing\"]', 'assets/images/experts/walim.jpg', 'Expert dalam Digital Marketing dan Marketing Komunikasi', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(2, 'fajar-akbar', 'Fajar Akbar, S.Kom, M.Kom', 'Lecturer, AI Practitioner', '[\"Artificial Intelligence\", \"Data Science\"]', 'assets/images/experts/fajar-akbar.jpg', 'Praktisi AI dan Data Science dengan pengalaman lebih dari 10 tahun', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(3, 'deni-gunawan', 'Deni Gunawan, M.Kom', 'AI Specialist, Design Grafis, Web Developer, Event Planner', '[\"Artificial Intelligence\", \"Mobile Development\", \"Web Development\", \"UI UX Design\", \"Content Creation\", \"Video Production\"]', 'assets/images/experts/deni-gunawan.jpg', 'Spesialis AI dengan keahlian lintas bidang di design, development, dan content creation', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(4, 'hasan-basri', 'Hasan Basri, M.Kom', 'Dosen', '[\"Artificial Intelligence\", \"Content Creation\"]', 'assets/images/experts/hasan-basri.jpg', 'Dosen berpengalaman dalam AI dan Content Creation', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(5, 'agung-fazriansyah', 'Agung Fazriansyah', 'Lecturer, Marcom, Relationship Officer', '[\"Artificial Intelligence\", \"Data Science\", \"Digital Transformation\", \"UI UX Design\", \"Branding\", \"Communication\"]', 'assets/images/experts/agung-fazriansyah.jpg', 'Dosen dan profesional marcom dengan fokus pada transformasi digital', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(6, 'sugiono', 'Sugiono, M.Kom', 'Lecturer', '[\"Artificial Intelligence\", \"Mobile Development\", \"Web Development\", \"Digital Marketing\", \"Content Creation\", \"Video Production\"]', 'assets/images/experts/sugiono.jpg', 'Dosen dengan keahlian komprehensif di bidang teknologi dan digital', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(7, 'ricki-sastra', 'Ricki Sastra, M.Kom', 'Dosen, Asesor Kompetensi, Generative AI Specialist', '[\"Artificial Intelligence\", \"Mobile Development\", \"Web Development\", \"Digital Transformation\", \"Project Management\", \"UI UX Design\"]', 'assets/images/experts/ricki-sastra.jpg', 'Spesialis Generative AI dan asesor kompetensi profesional', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(8, 'bryan-givan', 'Bryan Givan, S.E, M.M', 'Content Creator', '[\"Project Management\", \"Digital Marketing\", \"Content Creation\", \"Leadership\"]', 'assets/images/experts/bryan-givan.jpg', 'Content creator dan leader dalam digital marketing', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(9, 'nurul-ichsan', 'Nurul Ichsan, M.Kom', 'Creative Content, Public Speaker', '[\"Artificial Intelligence\", \"Digital Marketing\"]', 'assets/images/experts/nurul-ichsan.jpg', 'Pembicara publik dan content creator profesional', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(10, 'verry-riyanto', 'Verry Riyanto', 'Dosen', '[\"Artificial Intelligence\", \"IoT\", \"Digital Transformation\", \"Project Management\", \"Video Production\", \"Sustainable Cities Communities\"]', 'assets/images/experts/verry-riyanto.jpg', 'Dosen fokus pada IoT dan transformasi digital berkelanjutan', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(11, 'andry-maulana', 'Andry Maulana, M.Kom', 'Network Engineer', '[\"System Integration\"]', 'assets/images/experts/andry-maulana.jpg', 'Network engineer dan sistem integrator profesional', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(12, 'hendri-mahmud-nawawi', 'Hendri Mahmud Nawawi', 'Dosen, Web Developer', '[\"Data Science\", \"Web Development\", \"Content Creation\"]', 'assets/images/experts/hendri-mahmud-nawawi.jpg', 'Web developer dan data scientist berpengalaman', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(13, 'ibnu-alfarobi', 'Ibnu Alfarobi, M.Kom', 'Dosen', '[\"Artificial Intelligence\", \"Digital Marketing\", \"Ecommerce\"]', 'assets/images/experts/ibnu-alfarobi.jpg', 'Dosen dengan keahlian AI dan ecommerce', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(14, 'agung-baitul-hikmah', 'Agung Baitul Hikmah', 'Dosen dan Narsum', '[\"Artificial Intelligence\", \"Digital Marketing\"]', 'assets/images/experts/agung-baitul-hikmah.jpg', 'Dosen dan pembicara ahli dalam AI dan digital marketing', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37'),
(15, 'iyad-supriadin', 'Iyad Supriadin', 'Multimedia Creative', '[\"Digital Marketing\", \"Content Creation\", \"Video Production\", \"Graphic Design\", \"Photography\", \"Leadership\"]', 'assets/images/experts/iyad-supriadin.jpg', 'Creative multimedia profesional dengan keahlian multidisiplin', '{}', '2026-11-05 10:33:55', '2026-11-06 02:31:37');

-- --------------------------------------------------------

--
-- Table structure for table `fin_chart_of_accounts`
--

CREATE TABLE `fin_chart_of_accounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `kode_akun` varchar(20) NOT NULL,
  `nama_akun` varchar(100) NOT NULL,
  `tipe` enum('aset','liabilitas','ekuitas','pendapatan','beban') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fin_chart_of_accounts`
--

INSERT INTO `fin_chart_of_accounts` (`id`, `kode_akun`, `nama_akun`, `tipe`) VALUES
(1, '101', 'Kas Operasional', 'aset'),
(2, '102', 'Bank BCA', 'aset'),
(3, '401', 'Pendapatan Event/Workshop', 'pendapatan'),
(4, '501', 'Beban Gaji Karyawan', 'beban'),
(5, '502', 'Beban Operasional', 'beban'),
(6, '505', 'Biaya vendor', 'liabilitas');

-- --------------------------------------------------------

--
-- Table structure for table `fin_journal_entries`
--

CREATE TABLE `fin_journal_entries` (
  `id` int(10) UNSIGNED NOT NULL,
  `transaction_id` int(10) UNSIGNED NOT NULL,
  `account_id` int(10) UNSIGNED NOT NULL,
  `tipe` enum('debit','kredit') NOT NULL,
  `nominal` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fin_journal_entries`
--

INSERT INTO `fin_journal_entries` (`id`, `transaction_id`, `account_id`, `tipe`, `nominal`) VALUES
(1, 1, 1, 'debit', 1000000.00),
(2, 1, 2, 'kredit', 1000000.00),
(3, 2, 1, 'debit', 10000000.00),
(4, 2, 4, 'kredit', 10000000.00),
(5, 3, 1, 'debit', 50000.00),
(6, 3, 3, 'kredit', 50000.00),
(7, 4, 5, 'debit', 2000000.00),
(8, 4, 1, 'kredit', 2000000.00),
(9, 5, 1, 'debit', 70000.00),
(10, 5, 3, 'kredit', 70000.00),
(11, 6, 1, 'debit', 50000.00),
(12, 6, 3, 'kredit', 50000.00);

-- --------------------------------------------------------

--
-- Table structure for table `fin_transactions`
--

CREATE TABLE `fin_transactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `kode_transaksi` varchar(50) NOT NULL,
  `tgl_transaksi` date NOT NULL,
  `deskripsi` text NOT NULL,
  `sumber_modul` enum('manual','event','hrm_payroll','crm_invoice') DEFAULT 'manual',
  `referensi_id` int(10) UNSIGNED DEFAULT NULL,
  `created_by` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fin_transactions`
--

INSERT INTO `fin_transactions` (`id`, `kode_transaksi`, `tgl_transaksi`, `deskripsi`, `sumber_modul`, `referensi_id`, `created_by`) VALUES
(1, 'FIN-20261012-49D541', '2026-10-12', 'Biaya Workshop AI', 'manual', NULL, 2),
(2, 'FIN-20261012-CCD42E', '2026-10-12', 'Biaya gaji karyawan event', 'event', NULL, 2),
(3, 'TRX-EVENT-20261019190427-1', '2026-10-19', 'Pembayaran registrasi event dari Bagus Putra (bagus123@gmail.com)', 'event', 1, 5),
(4, 'FIN-20261109-309D74', '2026-11-09', 'Maintenance Event A', 'manual', NULL, 2),
(5, 'TRX-EVENT-20261109171559-2', '2026-11-09', 'Pembayaran registrasi event dari Bagus Putra (bagus123@gmail.com)', 'event', 2, 5),
(6, 'TRX-EVENT-20261124015849-4', '2026-11-24', 'Pembayaran registrasi event dari Bagus Putra (bagus123@gmail.com)', 'event', 4, 5);

-- --------------------------------------------------------

--
-- Table structure for table `hrm_employees`
--

CREATE TABLE `hrm_employees` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `nik` varchar(50) NOT NULL,
  `nama_lengkap` varchar(150) NOT NULL,
  `departemen` varchar(100) NOT NULL DEFAULT '',
  `jabatan` varchar(100) NOT NULL,
  `tgl_bergabung` date DEFAULT NULL,
  `gaji_pokok` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('kontrak','tetap','magang') DEFAULT 'kontrak',
  `email` varchar(150) NOT NULL DEFAULT '',
  `no_telp` varchar(20) NOT NULL DEFAULT '',
  `status_aktif` enum('Aktif','Cuti','Nonaktif') NOT NULL DEFAULT 'Aktif',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hrm_employees`
--

INSERT INTO `hrm_employees` (`id`, `user_id`, `nik`, `nama_lengkap`, `departemen`, `jabatan`, `tgl_bergabung`, `gaji_pokok`, `status`, `email`, `no_telp`, `status_aktif`, `created_at`, `updated_at`) VALUES
(1, NULL, '0000000000000003', 'Davina Nur Maulidia', 'Teknologi', 'Data Analyst', '2026-10-12', 9000000.00, 'kontrak', '', '', 'Cuti', '2026-10-12 22:45:28', NULL),
(2, NULL, '0000000000000004', 'Siti Aminah', 'HRD', 'Staf HR', '2026-06-10', 5000000.00, 'kontrak', '', '', 'Aktif', '2026-10-12 22:45:28', NULL),
(3, NULL, '0000000000000002', 'Dais Maya Sukma', 'Keuangan', 'Finance Staff', '2024-03-21', 8000000.00, 'kontrak', '', '', 'Aktif', '2026-10-12 22:45:28', NULL),
(4, NULL, '0000000000000001', 'Anggi Saputra', 'Teknologi', 'Data Analyst', '2026-09-12', 12000000.00, 'kontrak', 'tesjuga123@gmail.com', '', 'Aktif', '2026-10-12 22:45:28', '2026-10-12 23:01:35'),
(5, NULL, '0000000000000005', 'Septirani Hapsari', 'Marketing', 'Staff Marketing', '2026-07-04', 3000000.00, 'kontrak', '', '', 'Aktif', '2026-10-12 22:45:28', NULL),
(6, NULL, '0000000000000008', 'Natasya Risky', 'Administrasi', 'Staff Admin', '2025-10-01', 2000000.00, 'kontrak', '', '', 'Nonaktif', '2026-10-12 22:45:28', NULL),
(7, NULL, '0000000000000015', 'Bagus Putra', 'Teknologi', 'Staf HR', '2026-10-12', 3500000.00, 'kontrak', 'tes123@gmail.com', '0812345678', 'Aktif', '2026-10-12 22:47:53', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `hrm_events`
--

CREATE TABLE `hrm_events` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(150) NOT NULL,
  `event_date` date NOT NULL,
  `event_time` time DEFAULT NULL,
  `location` varchar(150) NOT NULL DEFAULT '',
  `category` varchar(60) NOT NULL DEFAULT '',
  `status` enum('Aktif','Selesai') NOT NULL DEFAULT 'Aktif',
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hrm_events`
--

INSERT INTO `hrm_events` (`id`, `title`, `event_date`, `event_time`, `location`, `category`, `status`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Pelatihan Komunikasi', '2026-10-15', NULL, '', '', 'Aktif', 'Pelatihan internal untuk meningkatkan komunikasi tim.', '2026-10-12 22:45:28', NULL),
(2, 'Town Hall DICO', '2026-10-22', NULL, '', '', 'Aktif', 'Pertemuan bulanan dan pembaruan perusahaan.', '2026-10-12 22:45:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `hrm_event_registrations`
--

CREATE TABLE `hrm_event_registrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `event_id` int(10) UNSIGNED NOT NULL,
  `participant_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `status` enum('Terdaftar','Hadir','Dibatalkan') NOT NULL DEFAULT 'Terdaftar',
  `registered_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hrm_leaves`
--

CREATE TABLE `hrm_leaves` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `tipe_cuti` enum('tahunan','sakit','izin') NOT NULL,
  `tgl_mulai` date NOT NULL,
  `tgl_selesai` date NOT NULL,
  `alasan` text DEFAULT NULL,
  `status` enum('menunggu','disetujui','ditolak') DEFAULT 'menunggu',
  `disetujui_oleh` int(10) UNSIGNED DEFAULT NULL,
  `review_note` varchar(255) NOT NULL DEFAULT '',
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hrm_leaves`
--

INSERT INTO `hrm_leaves` (`id`, `employee_id`, `tipe_cuti`, `tgl_mulai`, `tgl_selesai`, `alasan`, `status`, `disetujui_oleh`, `review_note`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, 4, 'sakit', '2026-10-12', '2026-10-12', 'in deskripsi', 'disetujui', NULL, 'Selamat istirahat', '2026-11-09 23:30:03', '2026-10-12 22:48:38', '2026-11-09 23:30:03');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `nama_role` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `nama_role`) VALUES
(4, 'CRM'),
(5, 'Event Manager'),
(2, 'Finance'),
(3, 'HRM'),
(1, 'Superadmin');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('aktif','nonaktif') DEFAULT 'aktif',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `nama`, `email`, `password_hash`, `status`, `created_at`) VALUES
(1, 1, 'Super Admin', 'admin@dico.local', '$2y$10$dvPteMQmzpK.Uwko5iEUD.K640rMJIL5wAmu1ddTk23EaSp4DBLim', 'aktif', '2026-10-08 12:38:02'),
(2, 2, 'Finance Staff', 'finance@dico.local', '$2y$10$dvPteMQmzpK.Uwko5iEUD.K640rMJIL5wAmu1ddTk23EaSp4DBLim', 'aktif', '2026-10-08 12:38:02'),
(3, 3, 'HRM Staff', 'hrm@dico.local', '$2y$10$dvPteMQmzpK.Uwko5iEUD.K640rMJIL5wAmu1ddTk23EaSp4DBLim', 'aktif', '2026-10-08 12:38:02'),
(4, 4, 'CRM Staff', 'crm@dico.local', '$2y$10$dvPteMQmzpK.Uwko5iEUD.K640rMJIL5wAmu1ddTk23EaSp4DBLim', 'aktif', '2026-10-08 12:38:02'),
(5, 5, 'Event Manager', 'event@dico.local', '$2y$10$dvPteMQmzpK.Uwko5iEUD.K640rMJIL5wAmu1ddTk23EaSp4DBLim', 'aktif', '2026-10-08 12:38:02');

-- --------------------------------------------------------

--
-- Table structure for table `workshops`
--

CREATE TABLE `workshops` (
  `id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `judul` varchar(200) NOT NULL,
  `pendiri_event` varchar(150) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `pembawa_materi` varchar(255) DEFAULT NULL,
  `tipe_event` enum('workshop','seminar','webinar') NOT NULL DEFAULT 'workshop',
  `gambar_url` varchar(255) DEFAULT NULL,
  `lokasi` varchar(200) DEFAULT NULL,
  `tgl_mulai` datetime NOT NULL,
  `tgl_selesai` datetime NOT NULL,
  `kapasitas` int(10) UNSIGNED NOT NULL DEFAULT 100,
  `harga` decimal(12,2) DEFAULT 0.00,
  `status` enum('draft','aktif','berlangsung','selesai') NOT NULL DEFAULT 'draft',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `workshops`
--

INSERT INTO `workshops` (`id`, `category_id`, `created_by`, `judul`, `pendiri_event`, `deskripsi`, `pembawa_materi`, `tipe_event`, `gambar_url`, `lokasi`, `tgl_mulai`, `tgl_selesai`, `kapasitas`, `harga`, `status`, `created_at`) VALUES
(3, 6, 5, 'Workshop Digital Kreatif Menjadi Mahasiswa berprestasi', 'Universitas Bina Sarana Informatika', 'Universitas Bina Sarana Informatika Kampus Surakarta menyelenggarakan Workshop Digital Kreatif: Menjadi Mahasiswa Berprestasi, sebuah acara inspiratif yang dirancang untuk membekali generasi muda dengan keterampilan, wawasan, dan strategi kreatif di era digital. Dipandu oleh M. Fahrel, workshop ini menjadi wadah bagi para mahasiswa dan anak muda untuk mengasah potensi, mengeksplorasi ide-ide baru, serta memahami bagaimana memanfaatkan kreativitas digital untuk meraih prestasi akademik maupun profesional. \r\n\r\nKegiatan ini diselenggarakan secara live pada Sabtu, 12 September 2026, pukul 09:00 WIB di Ruang 102 Universitas BSI Solo. Acara ini sangat cocok bagi mahasiswa, pelajar, dan siapa saja yang ingin mengembangkan diri, membangun portofolio digital, serta bersiap menjadi individu unggul di dunia industri kreatif. \r\n\r\n- Sesi wawasan dan pemaparan inspiratif dari M. Fahrel\r\n- Pemanfaatan kreativitas digital untuk mendukung prestasi mahasiswa\r\n- Diskusi interaktif dan eksplorasi ide-ide baru di era digital\r\n- Strategi pengembangan potensi diri dan portofolio kreatif\r\n- Kesempatan berjejaring dengan sesama mahasiswa dan komunitas kreatif', 'M. Fahrel', 'workshop', 'assets/uploads/events/event_20261012_092135_f727cf98.png', 'Ruang 102 UBSI Solo', '2026-10-20 09:00:00', '2026-10-20 13:00:00', 120, 50000.00, 'selesai', '2026-10-12 14:21:35'),
(5, 1, 5, 'Workshop Digital Kreatif: \"AI Skill Upgrade with Vibe Coding: Build Simple Websites and Turn Ideas into Income\"', 'Universitas Bina Sarana Informatika', 'Workshop Digital Kreatif: \"AI Skill Upgrade with Vibe Coding: Build Simple Websites and Turn Ideas into Income\" adalah acara interaktif yang dirancang untuk membantu peserta menguasai keterampilan coding berbasis AI secara praktis, dari sekadar menyusun prompt hingga menghasilkan situs web fungsional yang berpotensi menghasilkan income. Dipandu oleh Walim, M.Kom (AI Specialist & Partner of DICO), workshop ini membuka wawasan tentang cara mengubah ide kreatif menjadi portofolio dan proyek web modern secara cepat dan efisien.\r\n\r\nKegiatan ini akan dilaksanakan pada Rabu, 29 Juli 2026, pukul 09.00 – 12.00 WIB berlokasi di UBSI Kampus Cibitung. Dengan biaya investasi sebesar 20K, peserta akan mendapatkan benefit berupa E-Sertifikat, materi eksklusif, wawasan serta relasi baru (insight & network), hingga kesempatan memenangkan doorprize menarik.\r\n\r\n- Cara praktis mengubah prompt menjadi situs web modern dan profesional\r\n- Strategi memanfaatkan situs web buatan sendiri untuk menghasilkan income\r\n- Pemahaman Vibe Coding menggunakan bantuan teknologi AI\r\n- Sesi pemaparan materi eksklusif dan diskusi interaktif bersama AI Specialist\r\n- Kesempatan berjejaring (networking) serta memenangkan doorprize menarik', 'Walim, M.Kom', 'workshop', 'assets/uploads/events/event_20261012_094310_14d0df16.png', 'UBSI Kampus Cibitung', '2026-07-29 09:00:00', '2026-07-29 12:00:00', 50, 20000.00, 'selesai', '2026-10-12 14:43:10'),
(6, 1, 5, 'Workshop Digital Kreatif: \"Bikin Konten Tanpa Ribet\" (Jadi Bos Tanpa Karyawan dengan AI)', 'Universitas Bina Sarana Informatika', 'Workshop Digital Kreatif: \"Bikin Konten Tanpa Ribet\" (Jadi Bos Tanpa Karyawan dengan AI) adalah acara praktis yang dirancang untuk membantu para kreator konten, pelajar, dan pebisnis mandiri memanfaatkan teknologi kecerdasan buatan (AI) dalam memproduksi konten secara efisien. Dipandu oleh Fabryan Fandi DI (Content Creator), workshop ini akan membagikan strategi dan teknik mengelola pembuatan konten mandiri yang cepat dan efektif tanpa bergantung pada banyak tim.\r\n\r\nKegiatan ini akan dilaksanakan pada 23 Juli 2026 pukul 09:00 WIB berlokasi di UBSI Purwokerto (Jl. HR. Bunyamin No 106 Pabuaran, Purwokerto Utara). Dengan harga tiket masuk (HTM) sebesar IDR 50K, peserta akan mendapatkan benefit berupa E-Sertifikat serta fasilitas komputer yang dapat digunakan langsung saat praktek.\r\n\r\n- Panduan praktis membuat konten secara efisien memanfaatkan teknologi AI\r\n- Strategi mengelola produksi konten secara mandiri bak seorang profesional\r\n- Sesi praktek langsung menggunakan fasilitas komputer yang disediakan\r\n- Pemaparan ilmu dan pengalaman dari content creator Fabryan Fandi DI\r\n- Kesempatan berjejaring dengan sesama pegiat konten dan komunitas Digital Creative Community (DICO)', 'Fabryan Fandi DI', 'workshop', 'assets/uploads/events/event_20261012_094730_351f4d48.jpg', 'UBSI Purwokerto', '2026-07-23 09:00:00', '2026-07-23 12:00:00', 20, 50000.00, 'selesai', '2026-10-12 14:47:30'),
(7, 5, 5, 'Seminar Finance - Cashless tapi Nggak Careless: Hack Keuangan Cerdas di Era Digital', 'Universitas Bina Sarana Informatika', 'Seminar Finance: \"Cashless tapi Nggak Careless: Hack Keuangan Cerdas di Era Digital\" adalah acara edukatif yang dirancang untuk membantu generasi muda mengelola keuangan secara cerdas dan bijak di tengah maraknya transaksi nontunai (cashless). Dipandu oleh Satia Suhada, M.Kom (Head of Dico Sukabumi) dan Arya Lukmansyah (Relationship Manager Funding & Transaction), serta dipandu oleh Revalina Nurmalia sebagai Master of Ceremony, seminar ini membagikan trik praktis pengelolaan finansial yang aman dan efektif di era digital.\r\n\r\nKegiatan ini akan dilaksanakan pada Kamis, 23 Juli 2026, pukul 09.00 – 12.00 WIB berlokasi di Aula Kampus B UBSI Sukabumi. Dengan biaya investasi sebesar 20k (gratis bagi 50 pendaftar pertama), peserta akan mendapatkan benefit berupa E-Sertifikat, snack, suvenir eksklusif, ilmu bermanfaat, serta kesempatan bergabung dalam Komunitas Digital Kreatif.\r\n\r\n- Strategi dan trik mengelola finansial secara cerdas di era transaksi cashless\r\n- Pemahaman finansial digital langsung dari para pakar keuangan dan komunitas\r\n- Tips menghindari kebiasaan boros dan tetap kontrol atas keuangan pribadi\r\n- Sesi diskusi interaktif bersama narasumber berpengalaman\r\n- Kesempatan berjejaring dengan peserta lain dan bergabung di Komunitas Digital Kreatif', 'Revalina Nurmalia, Satia Suhada, M.kom, Arya Lukmansyah', 'seminar', NULL, 'UBSI Sukabumi Kampus B', '2026-07-23 09:00:00', '2026-07-23 12:00:00', 50, 20000.00, 'selesai', '2026-10-12 14:54:33'),
(10, 2, 5, 'tes event 3', 'Universitas Bina Sarana Informatika', '', 'M. Fahrel', 'workshop', 'assets/uploads/events/event_20261124_014715_a836e034.jpeg', 'UBSI Kampus Cibitung', '2026-11-24 09:46:00', '2026-11-24 11:46:00', 50, 50000.00, 'aktif', '2026-11-24 07:47:15');

-- --------------------------------------------------------

--
-- Table structure for table `workshop_categories`
--

CREATE TABLE `workshop_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `nama_kategori` varchar(100) NOT NULL,
  `icon_key` varchar(50) DEFAULT 'calendar',
  `color` varchar(20) DEFAULT '#2F8FFF'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `workshop_categories`
--

INSERT INTO `workshop_categories` (`id`, `nama_kategori`, `icon_key`, `color`) VALUES
(1, 'AI & Technology', 'cpu', '#2F8FFF'),
(2, 'Web Development', 'code', '#16CFEE'),
(3, 'UI/UX Design', 'pen', '#D34358'),
(4, 'Digital Marketing', 'brief', '#7c5cf0'),
(5, 'Business & Marketing', 'brief', '#F59E0B'),
(6, 'Career & Development', 'trend', '#10B981');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `crm_customers`
--
ALTER TABLE `crm_customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `sales_pic_id` (`sales_pic_id`);

--
-- Indexes for table `crm_interactions`
--
ALTER TABLE `crm_interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `event_registrations`
--
ALTER TABLE `event_registrations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `workshop_id` (`workshop_id`),
  ADD KEY `idx_er_customer` (`customer_id`);

--
-- Indexes for table `experts`
--
ALTER TABLE `experts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `expert_id` (`expert_id`);

--
-- Indexes for table `fin_chart_of_accounts`
--
ALTER TABLE `fin_chart_of_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_akun` (`kode_akun`);

--
-- Indexes for table `fin_journal_entries`
--
ALTER TABLE `fin_journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `fin_transactions`
--
ALTER TABLE `fin_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_transaksi` (`kode_transaksi`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `hrm_employees`
--
ALTER TABLE `hrm_employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `hrm_events`
--
ALTER TABLE `hrm_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hrm_events_date` (`event_date`);

--
-- Indexes for table `hrm_event_registrations`
--
ALTER TABLE `hrm_event_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_hrm_reg_event_email` (`event_id`,`email`);

--
-- Indexes for table `hrm_leaves`
--
ALTER TABLE `hrm_leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `disetujui_oleh` (`disetujui_oleh`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama_role` (`nama_role`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `workshops`
--
ALTER TABLE `workshops`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `workshop_categories`
--
ALTER TABLE `workshop_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama_kategori` (`nama_kategori`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `crm_customers`
--
ALTER TABLE `crm_customers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `crm_interactions`
--
ALTER TABLE `crm_interactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `event_registrations`
--
ALTER TABLE `event_registrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `experts`
--
ALTER TABLE `experts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `fin_chart_of_accounts`
--
ALTER TABLE `fin_chart_of_accounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `fin_journal_entries`
--
ALTER TABLE `fin_journal_entries`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `fin_transactions`
--
ALTER TABLE `fin_transactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `hrm_employees`
--
ALTER TABLE `hrm_employees`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `hrm_events`
--
ALTER TABLE `hrm_events`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `hrm_event_registrations`
--
ALTER TABLE `hrm_event_registrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hrm_leaves`
--
ALTER TABLE `hrm_leaves`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `workshops`
--
ALTER TABLE `workshops`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `workshop_categories`
--
ALTER TABLE `workshop_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `crm_customers`
--
ALTER TABLE `crm_customers`
  ADD CONSTRAINT `crm_customers_ibfk_1` FOREIGN KEY (`sales_pic_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `crm_interactions`
--
ALTER TABLE `crm_interactions`
  ADD CONSTRAINT `crm_interactions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `crm_customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `crm_interactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `event_registrations`
--
ALTER TABLE `event_registrations`
  ADD CONSTRAINT `event_registrations_ibfk_1` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `event_registrations_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `crm_customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `fin_journal_entries`
--
ALTER TABLE `fin_journal_entries`
  ADD CONSTRAINT `fin_journal_entries_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `fin_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fin_journal_entries_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `fin_chart_of_accounts` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `fin_transactions`
--
ALTER TABLE `fin_transactions`
  ADD CONSTRAINT `fin_transactions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `hrm_employees`
--
ALTER TABLE `hrm_employees`
  ADD CONSTRAINT `hrm_employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `hrm_event_registrations`
--
ALTER TABLE `hrm_event_registrations`
  ADD CONSTRAINT `hrm_event_registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `hrm_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `hrm_leaves`
--
ALTER TABLE `hrm_leaves`
  ADD CONSTRAINT `hrm_leaves_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `hrm_leaves_ibfk_2` FOREIGN KEY (`disetujui_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `workshops`
--
ALTER TABLE `workshops`
  ADD CONSTRAINT `workshops_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `workshop_categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `workshops_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
