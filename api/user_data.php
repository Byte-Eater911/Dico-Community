<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

$participant_id = (int)($_GET['participant_id'] ?? $_POST['participant_id'] ?? 0);

if ($participant_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Participant ID wajib disertakan"
    ]);
    exit;
}

$sqlEvents = "SELECT 
                o.id AS order_id,
                o.order_number,
                o.kode_tiket,
                o.total_amount,
                o.status_verifikasi AS sv,
                o.status_kehadiran AS sk,
                o.status_pembayaran AS sp,
                o.order_date,
                w.id AS event_id,
                w.judul AS nama_event,
                w.tipe_event,
                w.lokasi,
                DATE_FORMAT(w.tgl_mulai, '%d %b %Y %H:%i') AS tgl_mulai,
                DATE_FORMAT(w.tgl_selesai, '%d %b %Y') AS tgl_selesai,
                c.nama_kategori AS kategori,
                p.nama_produk AS jenis_tiket
              FROM orders o
              JOIN workshops w ON w.id = o.workshop_id
              LEFT JOIN workshop_categories c ON c.id = w.category_id
              LEFT JOIN products p ON p.id = o.product_id
              WHERE o.participant_id = ?
              ORDER BY o.id DESC";

$stmt = mysqli_prepare($koneksi, $sqlEvents);
mysqli_stmt_bind_param($stmt, "i", $participant_id);
mysqli_stmt_execute($stmt);
$resEvents = mysqli_stmt_get_result($stmt);

$myEvents = [];
while ($row = mysqli_fetch_assoc($resEvents)) {
    $myEvents[] = $row;
}
mysqli_stmt_close($stmt);

$sqlCerts = "SELECT 
                c.id,
                c.nomor_sertif,
                DATE_FORMAT(c.tgl_terbit, '%d %b %Y') AS tgl_terbit,
                c.file_url,
                w.judul AS nama_event
             FROM certificates c
             JOIN workshops w ON w.id = c.workshop_id
             WHERE c.participant_id = ?
             ORDER BY c.id DESC";

$stmtC = mysqli_prepare($koneksi, $sqlCerts);
mysqli_stmt_bind_param($stmtC, "i", $participant_id);
mysqli_stmt_execute($stmtC);
$resCerts = mysqli_stmt_get_result($stmtC);

$certs = [];
while ($row = mysqli_fetch_assoc($resCerts)) {
    $certs[] = $row;
}
mysqli_stmt_close($stmtC);

echo json_encode([
    "success" => true,
    "data" => [
        "myEvents" => $myEvents,
        "certificates" => $certs
    ]
]);
