<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/database.php';

if (!$koneksi) {
    echo json_encode(['success' => false, 'message' => 'Database tidak terhubung']);
    exit;
}

$sql = "SELECT w.*, c.nama_kategori 
        FROM workshops w 
        LEFT JOIN workshop_categories c ON w.category_id = c.id 
        WHERE w.status != 'draft'
        ORDER BY w.tgl_mulai DESC";

$result = mysqli_query($koneksi, $sql);

if (!$result) {
    echo json_encode(['success' => false, 'message' => mysqli_error($koneksi)]);
    exit;
}

$events = [];

while ($row = mysqli_fetch_assoc($result)) {
    $tglMulai = new DateTime($row['tgl_mulai']);
    $tglSelesai = new DateTime($row['tgl_selesai']);
    
    $lokasi = $row['lokasi'] ?? '';
    $isOnline = (bool)preg_match('/(online|zoom|gmeet|google meet|youtube)/i', $lokasi);

    if (!empty($row['gambar_url'])) {
        $filename = basename($row['gambar_url']);
        $poster = 'assets/images/events/' . $filename;
    } else {
        $poster = 'assets/images/poster-workshop.png';
    }

    $events[] = [
        'id' => (string)$row['id'],
        'featured' => true,
        'type' => strtolower($row['tipe_event'] ?? 'workshop'),
        'title' => $row['judul'],
        'date' => $tglMulai->format('Y-m-d'),
        'time' => $tglMulai->format('H.i') . ' - ' . $tglSelesai->format('H.i') . ' WIB',
        'mode' => $isOnline ? 'online' : 'offline',
        'venue' => $lokasi,
        'price' => (float)$row['harga'],
        'capacity' => (int)$row['kapasitas'],
        'regDeadline' => $tglMulai->format('Y-m-d\TH:i'),
        'category' => $row['nama_kategori'] ?? 'General',
        'icon' => 'fa-lightbulb',
        'speaker' => [
            'name' => $row['pembawa_materi'] ?? 'Panitia DICO',
            'role' => 'Pembicara',
            'bio' => 'Pendiri: ' . ($row['pendiri_event'] ?? 'DICO Community')
        ],
        'poster' => $poster,
        'banner' => null,
        'description' => array_filter(explode("\n", $row['deskripsi'] ?? '')),
        'status' => $row['status']
    ];
}

echo json_encode([
    'success' => true,
    'data' => $events
]);
