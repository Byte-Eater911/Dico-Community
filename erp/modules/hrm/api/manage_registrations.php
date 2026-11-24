<?php
/**
 * /api/manage_registrations.php
 * Akses ditutup. HRM tidak lagi mengelola registrasi peserta.
 */
header('Content-Type: application/json; charset=utf-8');
http_response_code(403);
echo json_encode([
    'success' => false,
    'message' => 'Akses ditolak: HRM tidak memiliki izin mengelola registrasi peserta.'
], JSON_UNESCAPED_UNICODE);
exit;
