<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if (!$koneksi) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database tidak terhubung']);
    exit;
}

try {
    $resUsers = mysqli_query($koneksi, "
        SELECT r.nama_role, COUNT(u.id) as count 
        FROM roles r 
        LEFT JOIN users u ON r.id = u.role_id AND u.status = 'aktif'
        GROUP BY r.id, r.nama_role
    ");
    $usersByRole = [];
    $totalUsers = 0;
    while ($row = mysqli_fetch_assoc($resUsers)) {
        $cnt = (int)$row['count'];
        $usersByRole[$row['nama_role']] = $cnt;
        $totalUsers += $cnt;
    }

    $resEvents = mysqli_query($koneksi, "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
            SUM(CASE WHEN status = 'berlangsung' THEN 1 ELSE 0 END) as berlangsung,
            SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
        FROM workshops
    ");
    $eventStats = mysqli_fetch_assoc($resEvents) ?: ['total' => 0, 'aktif' => 0, 'berlangsung' => 0, 'selesai' => 0, 'draft' => 0];

    $resEventCat = mysqli_query($koneksi, "
        SELECT c.nama_kategori, COUNT(w.id) as total
        FROM workshop_categories c
        LEFT JOIN workshops w ON c.id = w.category_id
        GROUP BY c.id, c.nama_kategori
        ORDER BY total DESC
    ");
    $eventsByCategory = [];
    while ($row = mysqli_fetch_assoc($resEventCat)) {
        $eventsByCategory[] = [
            'kategori' => $row['nama_kategori'],
            'total' => (int)$row['total']
        ];
    }

    $resReg = mysqli_query($koneksi, "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status_pembayaran = 'berhasil' THEN 1 ELSE 0 END) as berhasil,
            SUM(CASE WHEN status_pembayaran = 'menunggu' THEN 1 ELSE 0 END) as menunggu,
            SUM(CASE WHEN status_pembayaran = 'batal' THEN 1 ELSE 0 END) as batal,
            COALESCE(SUM(CASE WHEN status_pembayaran = 'berhasil' THEN total_bayar ELSE 0 END), 0) as total_omzet
        FROM event_registrations
    ");
    $regStats = mysqli_fetch_assoc($resReg) ?: ['total' => 0, 'berhasil' => 0, 'menunggu' => 0, 'batal' => 0, 'total_omzet' => 0];

    $resHrm = mysqli_query($koneksi, "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(COALESCE(status_aktif, status)) = 'aktif' THEN 1 ELSE 0 END) as aktif,
            SUM(CASE WHEN LOWER(COALESCE(status_aktif, status)) = 'cuti' THEN 1 ELSE 0 END) as cuti,
            SUM(CASE WHEN LOWER(COALESCE(status_aktif, status)) = 'nonaktif' THEN 1 ELSE 0 END) as nonaktif
        FROM hrm_employees
    ");
    $hrmStats = mysqli_fetch_assoc($resHrm) ?: ['total' => 0, 'aktif' => 0, 'cuti' => 0, 'nonaktif' => 0];

    $resLeaves = mysqli_query($koneksi, "
        SELECT COUNT(*) as total_pending 
        FROM hrm_leaves 
        WHERE status = 'menunggu'
    ");
    $rowLeaves = mysqli_fetch_assoc($resLeaves);
    $pendingLeaves = (int)($rowLeaves['total_pending'] ?? 0);

    $resCrm = mysqli_query($koneksi, "SELECT COUNT(*) as total FROM crm_customers");
    $rowCrm = mysqli_fetch_assoc($resCrm);
    $totalCustomer = (int)($rowCrm['total'] ?? 0);

    $resInteractions = mysqli_query($koneksi, "
        SELECT tipe_kontak, COUNT(*) as count 
        FROM crm_interactions 
        GROUP BY tipe_kontak
    ");
    $interactionsByType = [];
    $totalInteractions = 0;
    while ($row = mysqli_fetch_assoc($resInteractions)) {
        $cnt = (int)$row['count'];
        $interactionsByType[$row['tipe_kontak']] = $cnt;
        $totalInteractions += $cnt;
    }

    $resKas = mysqli_query($koneksi, "
        SELECT 
            COALESCE(SUM(CASE WHEN tipe = 'debit' THEN nominal ELSE -nominal END), 0) AS saldo 
        FROM fin_journal_entries WHERE account_id = 1
    ");
    $rowKas = mysqli_fetch_assoc($resKas);
    $saldoKas = (float)($rowKas['saldo'] ?? 0);

    $resFinMonthly = mysqli_query($koneksi, "
        SELECT 
            DATE_FORMAT(t.tgl_transaksi, '%Y-%m') as bulan,
            COALESCE(SUM(CASE WHEN j.tipe = 'debit' THEN j.nominal ELSE 0 END), 0) as pemasukan,
            COALESCE(SUM(CASE WHEN j.tipe = 'kredit' THEN j.nominal ELSE 0 END), 0) as pengeluaran
        FROM fin_journal_entries j
        INNER JOIN fin_transactions t ON t.id = j.transaction_id
        WHERE t.tgl_transaksi >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(t.tgl_transaksi, '%Y-%m')
        ORDER BY bulan ASC
    ");
    $monthlyFinance = [];
    while ($row = mysqli_fetch_assoc($resFinMonthly)) {
        $monthlyFinance[] = [
            'bulan' => $row['bulan'],
            'pemasukan' => (float)$row['pemasukan'],
            'pengeluaran' => (float)$row['pengeluaran']
        ];
    }

    if (empty($monthlyFinance)) {
        $monthlyFinance[] = [
            'bulan' => date('Y-m'),
            'pemasukan' => (float)$regStats['total_omzet'],
            'pengeluaran' => 0
        ];
    }

    $resRecentRegs = mysqli_query($koneksi, "
        SELECT er.id, er.nama_peserta, er.email_peserta, er.total_bayar, er.status_pembayaran, er.created_at, w.judul as event_judul
        FROM event_registrations er
        LEFT JOIN workshops w ON er.workshop_id = w.id
        ORDER BY er.id DESC
        LIMIT 5
    ");
    $recentRegistrations = [];
    while ($row = mysqli_fetch_assoc($resRecentRegs)) {
        $recentRegistrations[] = $row;
    }

    $resUpcomingEvents = mysqli_query($koneksi, "
        SELECT id, judul, tgl_mulai, lokasi, harga, status, kapasitas
        FROM workshops
        ORDER BY tgl_mulai DESC
        LIMIT 5
    ");
    $recentEvents = [];
    while ($row = mysqli_fetch_assoc($resUpcomingEvents)) {
        $recentEvents[] = $row;
    }

    $resRecentTx = mysqli_query($koneksi, "
        SELECT t.id, t.kode_transaksi, t.tgl_transaksi, t.deskripsi, t.sumber_modul,
               COALESCE(SUM(CASE WHEN j.account_id = 1 THEN j.nominal ELSE 0 END), 0) AS total_nominal,
               COALESCE(MAX(CASE WHEN j.account_id = 1 THEN j.tipe ELSE NULL END), MAX(j.tipe)) AS tipe
        FROM fin_transactions t
        LEFT JOIN fin_journal_entries j ON j.transaction_id = t.id
        GROUP BY t.id, t.kode_transaksi, t.tgl_transaksi, t.deskripsi, t.sumber_modul
        ORDER BY t.id DESC
        LIMIT 5
    ");
    $recentTransactions = [];
    while ($row = mysqli_fetch_assoc($resRecentTx)) {
        $recentTransactions[] = $row;
    }

    $resOccupancy = mysqli_query($koneksi, "
        SELECT w.id, w.judul, w.kapasitas, w.status,
               COUNT(er.id) AS peserta_terdaftar
        FROM workshops w
        LEFT JOIN event_registrations er ON er.workshop_id = w.id
            AND er.status_pembayaran = 'berhasil'
        WHERE w.status IN ('aktif', 'berlangsung')
        GROUP BY w.id, w.judul, w.kapasitas, w.status
        ORDER BY w.tgl_mulai ASC, w.id DESC
        LIMIT 5
    ");
    $eventOccupancy = [];
    while ($row = mysqli_fetch_assoc($resOccupancy)) {
        $capacity = (int)($row['kapasitas'] ?? 0);
        $registered = (int)$row['peserta_terdaftar'];
        $row['kapasitas'] = $capacity;
        $row['peserta_terdaftar'] = $registered;
        $row['persentase'] = $capacity > 0 ? min(100, round(($registered / $capacity) * 100, 1)) : 0;
        $eventOccupancy[] = $row;
    }

    $resRecentLeaves = mysqli_query($koneksi, "
        SELECT l.id, l.tipe_cuti, l.tgl_mulai, l.tgl_selesai, l.alasan, l.status, e.nama_lengkap as nama_karyawan, e.jabatan as position
        FROM hrm_leaves l
        LEFT JOIN hrm_employees e ON l.employee_id = e.id
        WHERE l.status = 'menunggu'
        ORDER BY l.id DESC
        LIMIT 5
    ");
    $recentLeaves = [];
    while ($row = mysqli_fetch_assoc($resRecentLeaves)) {
        $recentLeaves[] = $row;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'total_event' => (int)$eventStats['total'],
            'total_karyawan' => (int)$hrmStats['total'],
            'total_customer' => $totalCustomer,
            'saldo_kas' => $saldoKas,

            'users' => [
                'total' => $totalUsers,
                'by_role' => $usersByRole
            ],
            'events' => [
                'total' => (int)$eventStats['total'],
                'occupancy' => $eventOccupancy,
                'aktif' => (int)$eventStats['aktif'],
                'berlangsung' => (int)$eventStats['berlangsung'],
                'selesai' => (int)$eventStats['selesai'],
                'draft' => (int)$eventStats['draft'],
                'by_category' => $eventsByCategory,
                'recent' => $recentEvents
            ],
            'registrations' => [
                'total' => (int)$regStats['total'],
                'berhasil' => (int)$regStats['berhasil'],
                'menunggu' => (int)$regStats['menunggu'],
                'batal' => (int)$regStats['batal'],
                'total_omzet' => (float)$regStats['total_omzet'],
                'recent' => $recentRegistrations
            ],
            'hrm' => [
                'total' => (int)$hrmStats['total'],
                'aktif' => (int)$hrmStats['aktif'],
                'cuti' => (int)$hrmStats['cuti'],
                'nonaktif' => (int)$hrmStats['nonaktif'],
                'pending_leaves' => $pendingLeaves,
                'recent_leaves' => $recentLeaves
            ],
            'crm' => [
                'total_customers' => $totalCustomer,
                'total_interactions' => $totalInteractions,
                'by_contact_type' => $interactionsByType
            ],
            'finance' => [
                'saldo_kas' => $saldoKas,
                'monthly_trend' => $monthlyFinance,
                'recent_transactions' => $recentTransactions
            ],
            'system' => [
                'server_time' => date('d M Y H:i:s'),
                'php_version' => PHP_VERSION,
                'db_status' => 'Connected',
                'os' => PHP_OS_FAMILY,
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'PHP built-in/web server'
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
    ]);
}
