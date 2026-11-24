<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once __DIR__ . '/../config/database.php';
$ok = ($koneksi && @mysqli_ping($koneksi));
$dbExists = false; $tables = [];
if ($ok) {
    $r = @mysqli_query($koneksi, "SHOW TABLES");
    if ($r) { while($row=mysqli_fetch_row($r)) $tables[]=$row[0]; $dbExists=true; }
}
echo json_encode([
    "success" => $ok,
    "connected" => $ok,
    "database" => "dico_community",
    "last_error" => $GLOBALS['lastDbError'] ?? null,
    "tables_found" => $tables,
    "has_participants" => in_array('participants',$tables),
    "has_users" => in_array('users',$tables),
    "hint" => $ok ? "Database terhubung OK" : "MySQL belum Start atau DB belum di-import. Buka XAMPP > Start MySQL, lalu phpMyAdmin > Import database/dico_community_new.sql",
    "hardcoded_admin" => "admin / admin123 (tetap bisa login meski DB mati)"
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
