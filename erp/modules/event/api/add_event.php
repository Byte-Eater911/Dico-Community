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
    echo json_encode(['success' => false, 'message' => 'Akses ditolak: Hanya Superadmin dan Event Manager yang dapat menambah event']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method harus POST']);
    exit;
}

$judul          = trim($_POST['judul'] ?? '');
$category_id    = (int)($_POST['category_id'] ?? 1);
$pendiri_event  = trim($_POST['pendiri_event'] ?? '');
$deskripsi      = trim($_POST['deskripsi'] ?? '');
$pembawa_materi = trim($_POST['pembawa_materi'] ?? '');
$tipe_event     = trim($_POST['tipe_event'] ?? 'workshop');
$lokasi         = trim($_POST['lokasi'] ?? '');
$tgl_mulai      = trim($_POST['tgl_mulai'] ?? '');
$tgl_selesai    = trim($_POST['tgl_selesai'] ?? '');
$kapasitas      = (int)($_POST['kapasitas'] ?? 100);
$harga          = (float)($_POST['harga'] ?? 0);
$created_by     = $_SESSION['user_id'];
$status         = 'aktif';

if ($judul === '' || $tgl_mulai === '' || $tgl_selesai === '' || $lokasi === '') {
    echo json_encode(['success' => false, 'message' => 'Judul, Tanggal Mulai, Tanggal Selesai, dan Lokasi wajib diisi']);
    exit;
}

// Handle poster upload
$gambar_url = null;
if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['poster'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] <= $maxSize) {
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (in_array($ext, $allowed, true)) {
            $uploadDir = __DIR__ . '/../../../../assets/uploads/events/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $fname = 'event_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            if (move_uploaded_file($file['tmp_name'], $uploadDir . $fname)) {
                $gambar_url = 'assets/uploads/events/' . $fname;
            }
        }
    }
}

$sql = "INSERT INTO workshops (category_id, created_by, judul, pendiri_event, deskripsi, pembawa_materi, tipe_event, gambar_url, lokasi, tgl_mulai, tgl_selesai, kapasitas, harga, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = mysqli_prepare($koneksi, $sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => mysqli_error($koneksi)]);
    exit;
}

mysqli_stmt_bind_param($stmt, "iisssssssssids",
    $category_id, $created_by, $judul, $pendiri_event, $deskripsi,
    $pembawa_materi, $tipe_event, $gambar_url, $lokasi,
    $tgl_mulai, $tgl_selesai, $kapasitas, $harga, $status
);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode([
        'success' => true,
        'message' => 'Event berhasil ditambahkan',
        'id' => mysqli_insert_id($koneksi)
    ]);
} else {
    echo json_encode(['success' => false, 'message' => mysqli_stmt_error($stmt)]);
}

mysqli_stmt_close($stmt);
