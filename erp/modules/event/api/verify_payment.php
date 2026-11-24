<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../../config/database.php';

session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role_name'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$allowed_roles = ['Superadmin', 'Event Manager'];
if (!in_array($_SESSION['role_name'], $allowed_roles)) {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak: Hanya Superadmin dan Event Manager yang dapat memverifikasi pembayaran']);
    exit;
}

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID registrasi tidak valid']);
    exit;
}

$res = mysqli_query($koneksi, "SELECT * FROM event_registrations WHERE id = $id LIMIT 1");
$reg = mysqli_fetch_assoc($res);
if (!$reg) {
    echo json_encode(['success' => false, 'message' => 'Data registrasi tidak ditemukan']);
    exit;
}

if ($reg['status_pembayaran'] === 'berhasil') {
    echo json_encode(['success' => false, 'message' => 'Pembayaran sudah diverifikasi sebelumnya']);
    exit;
}

// 1. Update status pembayaran
mysqli_query($koneksi, "UPDATE event_registrations SET status_pembayaran = 'berhasil' WHERE id = $id");

// 2. Auto-post to Finance (fin_transactions + fin_journal_entries)
$kode_transaksi = 'TRX-EVENT-' . date('YmdHis') . '-' . $id;
$tgl_transaksi = date('Y-m-d');
$deskripsi = "Pembayaran registrasi event dari " . $reg['nama_peserta'] . " (" . $reg['email_peserta'] . ")";
$total = $reg['total_bayar'];
$created_by = $_SESSION['user_id'];

// Insert transaksi
$sqlTrx = "INSERT INTO fin_transactions (kode_transaksi, tgl_transaksi, deskripsi, sumber_modul, referensi_id, created_by)
           VALUES (?, ?, ?, 'event', ?, ?)";
$stmtTrx = mysqli_prepare($koneksi, $sqlTrx);
mysqli_stmt_bind_param($stmtTrx, "sssii", $kode_transaksi, $tgl_transaksi, $deskripsi, $id, $created_by);
mysqli_stmt_execute($stmtTrx);
$transaction_id = mysqli_insert_id($koneksi);
mysqli_stmt_close($stmtTrx);

// Debit Kas (account 1)
$sqlJurnalDebit = "INSERT INTO fin_journal_entries (transaction_id, account_id, tipe, nominal) VALUES (?, 1, 'debit', ?)";
$stmtD = mysqli_prepare($koneksi, $sqlJurnalDebit);
mysqli_stmt_bind_param($stmtD, "id", $transaction_id, $total);
mysqli_stmt_execute($stmtD);
mysqli_stmt_close($stmtD);

// Kredit Pendapatan Event (account 3)
$sqlJurnalKredit = "INSERT INTO fin_journal_entries (transaction_id, account_id, tipe, nominal) VALUES (?, 3, 'kredit', ?)";
$stmtK = mysqli_prepare($koneksi, $sqlJurnalKredit);
mysqli_stmt_bind_param($stmtK, "id", $transaction_id, $total);
mysqli_stmt_execute($stmtK);
mysqli_stmt_close($stmtK);

echo json_encode([
    'success' => true,
    'message' => 'Pembayaran berhasil diverifikasi dan tercatat di Finance',
    'transaction_id' => $transaction_id
]);
