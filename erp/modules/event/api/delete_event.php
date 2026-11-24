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
    echo json_encode(['success' => false, 'message' => 'Akses ditolak: Hanya Superadmin dan Event Manager yang dapat menghapus event']);
    exit;
}

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID event tidak valid']);
    exit;
}

// Delete associated poster file
$res = mysqli_query($koneksi, "SELECT gambar_url FROM workshops WHERE id = $id LIMIT 1");
if ($row = mysqli_fetch_assoc($res)) {
    if (!empty($row['gambar_url']) && file_exists(__DIR__ . '/../../../../' . $row['gambar_url'])) {
        @unlink(__DIR__ . '/../../../../' . $row['gambar_url']);
    }
}

$sql = "DELETE FROM workshops WHERE id = ?";
$stmt = mysqli_prepare($koneksi, $sql);
mysqli_stmt_bind_param($stmt, "i", $id);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode(['success' => true, 'message' => 'Event berhasil dihapus']);
} else {
    echo json_encode(['success' => false, 'message' => mysqli_stmt_error($stmt)]);
}

mysqli_stmt_close($stmt);
