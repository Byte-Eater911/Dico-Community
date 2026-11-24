<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() !== PHP_SESSION_ACTIVE) session_start();
require_once __DIR__ . '/../../../../config/database.php';

function fin_json($success, $message, $data = null, $status = 200) {
    http_response_code($status);
    $out = ['success' => $success, 'message' => $message];
    if ($data !== null) $out['data'] = $data;
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    exit;
}
function fin_require_access($write = false) {
    global $koneksi;
    if (empty($_SESSION['user_id'])) fin_json(false, 'Sesi login tidak ditemukan. Silakan login kembali.', null, 401);
    $role = $_SESSION['role_name'] ?? '';
    if (!in_array($role, ['Superadmin', 'Finance'], true)) fin_json(false, 'Akses ditolak. Modul ini hanya untuk Finance dan Superadmin.', null, 403);
    if (!$koneksi) fin_json(false, 'Database tidak terhubung. Pastikan MySQL aktif dan database dico_community sudah diimpor.', null, 500);
}
function fin_read_input() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $_POST;
}
function fin_stmt($sql, $types = '', $values = []) {
    global $koneksi;
    $stmt = mysqli_prepare($koneksi, $sql);
    if (!$stmt) fin_json(false, 'Query database gagal.', null, 500);
    if ($types !== '') mysqli_stmt_bind_param($stmt, $types, ...$values);
    if (!mysqli_stmt_execute($stmt)) {
        $error = mysqli_stmt_error($stmt);
        mysqli_stmt_close($stmt);
        if (str_contains($error, 'Duplicate')) fin_json(false, 'Kode sudah digunakan. Gunakan kode yang berbeda.', null, 409);
        fin_json(false, 'Gagal memproses data keuangan.', null, 500);
    }
    return $stmt;
}
