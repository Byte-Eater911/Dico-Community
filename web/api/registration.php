<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once __DIR__ . '/../../config/database.php';

if (!$koneksi) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database tidak terhubung']);
    exit;
}
if (!isset($_SESSION['customer_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Silakan login terlebih dahulu']);
    exit;
}

$customerId = (int)$_SESSION['customer_id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

function out($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function mapStatus($dbStatus, $amount, $hasProof) {
    if ($dbStatus === 'berhasil') return 'terverifikasi';
    if ($dbStatus === 'batal')    return 'ditolak';
    if ($amount <= 0)             return 'terdaftar';
    if ($hasProof)                return 'menunggu_verifikasi';
    return 'menunggu_pembayaran';
}

function buildReg($row) {
    $amount = (float)$row['total_bayar'];
    return [
        'id'        => (string)$row['id'],
        'eventId'   => (string)$row['workshop_id'],
        'nama'      => $row['nama_peserta'],
        'email'     => $row['email_peserta'],
        'wa'        => $row['no_hp'] ?? '',
        'instansi'  => $row['instansi'] ?? '',
        'jenis'     => $row['jenis_pendaftar'] ?? '',
        'amount'    => $amount,
        'status'    => mapStatus($row['status_pembayaran'], $amount, !empty($row['payment_proof'])),
        'payment'   => !empty($row['payment_proof']) ? ['fileName' => basename($row['payment_proof']), 'uploadedAt' => $row['created_at']] : null,
        'createdAt' => $row['created_at'],
    ];
}

if ($action === 'search') {
    $eventId = (int)($_GET['event_id'] ?? 0);
    if ($eventId <= 0) out(['success' => true, 'registration' => null]);

    $stmt = mysqli_prepare($koneksi, "SELECT * FROM event_registrations WHERE workshop_id = ? AND customer_id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 'ii', $eventId, $customerId);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if (!$row) out(['success' => true, 'registration' => null]);
    out(['success' => true, 'registration' => buildReg($row)]);
}

if ($action === 'create') {
    $workshopId = (int)($_POST['event_id'] ?? 0);
    $nama       = trim($_POST['nama'] ?? '');
    $email      = trim($_POST['email'] ?? '');
    $wa         = trim($_POST['wa'] ?? '');
    $instansi   = trim($_POST['instansi'] ?? '');
    $jenis      = trim($_POST['jenis'] ?? '');

    if (!$workshopId || $nama === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $wa === '' || $instansi === '' || $jenis === '') {
        out(['success' => false, 'message' => 'Data pendaftaran belum lengkap']);
    }

    // Cek event exists & active
    $stmt = mysqli_prepare($koneksi, "SELECT id, harga, status FROM workshops WHERE id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 'i', $workshopId);
    mysqli_stmt_execute($stmt);
    $event = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if (!$event || !in_array($event['status'], ['aktif', 'berlangsung'], true)) {
        out(['success' => false, 'message' => 'Event tidak tersedia untuk pendaftaran']);
    }

    // Cek duplikat
    $stmt = mysqli_prepare($koneksi, "SELECT id FROM event_registrations WHERE workshop_id = ? AND customer_id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 'ii', $workshopId, $customerId);
    mysqli_stmt_execute($stmt);
    $exists = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if ($exists) {
        out(['success' => false, 'message' => 'Kamu sudah terdaftar di event ini', 'code' => 'ALREADY_REGISTERED', 'id' => $exists['id']]);
    }

    $amount = (float)$event['harga'];
    $statusDb = 'menunggu'; // default DB enum

    $stmt = mysqli_prepare($koneksi,
        "INSERT INTO event_registrations (workshop_id, customer_id, nama_peserta, email_peserta, no_hp, instansi, jenis_pendaftar, status_pembayaran, total_bayar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    mysqli_stmt_bind_param($stmt, 'iissssssd', $workshopId, $customerId, $nama, $email, $wa, $instansi, $jenis, $statusDb, $amount);

    if (!mysqli_stmt_execute($stmt)) {
        out(['success' => false, 'message' => mysqli_error($koneksi)]);
    }

    $id = mysqli_insert_id($koneksi);
    mysqli_stmt_close($stmt);

    out([
        'success' => true,
        'registration' => [
            'id'      => (string)$id,
            'eventId' => (string)$workshopId,
            'nama'    => $nama,
            'email'   => $email,
            'wa'      => $wa,
            'instansi'=> $instansi,
            'jenis'   => $jenis,
            'amount'  => $amount,
            'status'  => $amount > 0 ? 'menunggu_pembayaran' : 'terdaftar',
            'payment' => null,
            'createdAt' => date('Y-m-d H:i:s'),
        ]
    ]);
}

if ($action === 'get') {
    $id = (int)($_GET['id'] ?? 0);

    $stmt = mysqli_prepare($koneksi, "SELECT * FROM event_registrations WHERE id = ? AND customer_id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 'ii', $id, $customerId);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if (!$row) out(['success' => false, 'message' => 'Pendaftaran tidak ditemukan', 'code' => 'NOT_FOUND']);

    out(['success' => true, 'registration' => buildReg($row)]);
}

if ($action === 'upload') {
    $id = (int)($_POST['reg_id'] ?? 0);

    $stmt = mysqli_prepare($koneksi, "SELECT * FROM event_registrations WHERE id = ? AND customer_id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 'ii', $id, $customerId);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    if (!$row) out(['success' => false, 'message' => 'Pendaftaran tidak ditemukan']);

    if (empty($_FILES['proof']) || $_FILES['proof']['error'] !== UPLOAD_ERR_OK) {
        out(['success' => false, 'message' => 'Bukti pembayaran wajib diunggah']);
    }

    $file = $_FILES['proof'];
    if ($file['size'] > 2 * 1024 * 1024) {
        out(['success' => false, 'message' => 'Ukuran file maksimal 2 MB']);
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'application/pdf' => 'pdf'];
    if (!isset($allowed[$mime])) {
        out(['success' => false, 'message' => 'Format bukti pembayaran tidak didukung']);
    }

    $dir = __DIR__ . '/../../uploads/payment-proofs';
    if (!is_dir($dir)) mkdir($dir, 0775, true);

    $name = 'payment_' . $id . '_' . bin2hex(random_bytes(5)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
        out(['success' => false, 'message' => 'Gagal menyimpan bukti pembayaran']);
    }

    $proof = 'uploads/payment-proofs/' . $name;
    $stmt = mysqli_prepare($koneksi, "UPDATE event_registrations SET status_pembayaran = 'menunggu', payment_proof = ? WHERE id = ? AND customer_id = ?");
    mysqli_stmt_bind_param($stmt, 'sii', $proof, $id, $customerId);

    if (!mysqli_stmt_execute($stmt)) {
        out(['success' => false, 'message' => 'Gagal menyimpan data: ' . mysqli_error($koneksi)]);
    }
    mysqli_stmt_close($stmt);

    $stmt = mysqli_prepare($koneksi, "SELECT * FROM event_registrations WHERE id = ? AND customer_id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 'ii', $id, $customerId);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    out(['success' => true, 'message' => 'Bukti pembayaran berhasil dikirim', 'registration' => buildReg($row)]);
}

if ($action === 'profile') {
    $stmt = mysqli_prepare($koneksi,
        "SELECT er.*, w.judul, w.tgl_mulai, w.tgl_selesai, w.lokasi, w.harga
         FROM event_registrations er
         JOIN workshops w ON w.id = er.workshop_id
         WHERE er.customer_id = ?
         ORDER BY er.created_at DESC"
    );
    mysqli_stmt_bind_param($stmt, 'i', $customerId);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
    $rows = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $amount = (float)$r['total_bayar'];
        $rows[] = [
            'id'        => (string)$r['id'],
            'code'      => 'TIK-' . $r['id'],
            'eventId'   => (string)$r['workshop_id'],
            'eventTitle'=> $r['judul'],
            'eventDate' => $r['tgl_mulai'],
            'eventVenue'=> $r['lokasi'],
            'nama'      => $r['nama_peserta'],
            'email'     => $r['email_peserta'],
            'wa'        => $r['no_hp'] ?? '',
            'instansi'  => $r['instansi'] ?? '',
            'jenis'     => $r['jenis_pendaftar'] ?? '',
            'amount'    => $amount,
            'status'    => mapStatus($r['status_pembayaran'], $amount, !empty($r['payment_proof'])),
            'created_at'=> $r['created_at'],
        ];
    }
    out(['success' => true, 'data' => $rows]);
}

out(['success' => false, 'message' => 'Action tidak valid']);
