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
    echo json_encode(['success' => false, 'message' => 'Akses ditolak: Hanya Superadmin dan Event Manager yang dapat melihat data registrasi']);
    exit;
}

$workshop_id = (int)($_GET['workshop_id'] ?? 0);

$sql = "SELECT er.*, w.judul AS workshop_judul, w.tgl_mulai, w.harga
        FROM event_registrations er
        LEFT JOIN workshops w ON er.workshop_id = w.id";

if ($workshop_id > 0) {
    $sql .= " WHERE er.workshop_id = $workshop_id";
}

$sql .= " ORDER BY er.id DESC";

$res = mysqli_query($koneksi, $sql);
if (!$res) {
    echo json_encode(['success' => false, 'message' => mysqli_error($koneksi)]);
    exit;
}

$registrations = [];
while ($row = mysqli_fetch_assoc($res)) {
    $registrations[] = $row;
}

$evRes = mysqli_query($koneksi, "SELECT id, judul FROM workshops ORDER BY tgl_mulai DESC");
$workshops = [];
while ($ev = mysqli_fetch_assoc($evRes)) {
    $workshops[] = $ev;
}

echo json_encode([
    'success' => true,
    'data' => $registrations,
    'workshops' => $workshops
]);
