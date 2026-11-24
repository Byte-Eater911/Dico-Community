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
    echo json_encode(['success' => false, 'message' => 'Akses ditolak: Hanya Superadmin dan Event Manager yang dapat mengubah event']);
    exit;
}

$id = (int)($_POST['id'] ?? 0);
$status = trim($_POST['status'] ?? '');

$allowedStatus = ['draft', 'aktif', 'berlangsung', 'selesai'];
if ($id <= 0 || !in_array($status, $allowedStatus, true)) {
    echo json_encode(['success' => false, 'message' => 'Parameter tidak valid']);
    exit;
}

$sql = "UPDATE workshops SET status = ? WHERE id = ?";
$stmt = mysqli_prepare($koneksi, $sql);
mysqli_stmt_bind_param($stmt, "si", $status, $id);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode(['success' => true, 'message' => 'Status event berhasil diubah']);
} else {
    echo json_encode(['success' => false, 'message' => mysqli_stmt_error($stmt)]);
}

mysqli_stmt_close($stmt);
