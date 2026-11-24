<?php
/**
 * /api/manage_events.php
 * Akses ditutup. HRM tidak lagi mengelola event.
 */
header('Content-Type: application/json; charset=utf-8');
http_response_code(403);
echo json_encode([
    'success' => false,
    'message' => 'Akses ditolak: HRM tidak memiliki izin mengelola event.'
], JSON_UNESCAPED_UNICODE);
exit;
