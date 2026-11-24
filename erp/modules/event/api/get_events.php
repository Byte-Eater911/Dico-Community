<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../../../config/database.php';

session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if (!$koneksi) {
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal']);
    exit;
}

$sql = "SELECT w.*, c.nama_kategori, u.nama AS pembuat 
        FROM workshops w
        LEFT JOIN workshop_categories c ON w.category_id = c.id
        LEFT JOIN users u ON w.created_by = u.id
        ORDER BY w.id DESC";

$res = mysqli_query($koneksi, $sql);
if (!$res) {
    echo json_encode(['success' => false, 'message' => mysqli_error($koneksi)]);
    exit;
}

$events = [];
while ($row = mysqli_fetch_assoc($res)) {
    $events[] = $row;
}

$catRes = mysqli_query($koneksi, "SELECT id, nama_kategori FROM workshop_categories ORDER BY id ASC");
$categories = [];
while ($cat = mysqli_fetch_assoc($catRes)) {
    $categories[] = $cat;
}

echo json_encode([
    'success' => true,
    'data' => $events,
    'categories' => $categories
]);
