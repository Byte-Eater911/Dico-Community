<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

try {
    $sql = "SELECT expert_id, nama, role, skills, foto_url, bio, social_media 
            FROM experts 
            ORDER BY nama ASC";
    
    $result = mysqli_query($koneksi, $sql);
    
    if (!$result) {
        throw new Exception(mysqli_error($koneksi));
    }
    
    $experts = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $experts[] = [
            'id' => $row['expert_id'],
            'name' => $row['nama'],
            'role' => $row['role'],
            'skills' => json_decode($row['skills'], true) ?: [],
            'foto_url' => $row['foto_url'],
            'bio' => $row['bio'] ?: '',
            'social_media' => json_decode($row['social_media'], true) ?: []
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $experts
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data expert: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
