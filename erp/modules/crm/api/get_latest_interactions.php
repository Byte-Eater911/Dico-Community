<?php

header("Content-Type: application/json");

require_once "db.php";

$sql = "
SELECT 
    i.id,
    c.nama,
    i.tipe_kontak as keperluan,
    i.catatan as pesan
FROM crm_interactions i
JOIN crm_customers c ON i.customer_id = c.id
ORDER BY i.id DESC
LIMIT 5
";

$result = $conn->query($sql);

$data = [];

if($result){
    while($row = $result->fetch_assoc()){
        $data[] = $row;
    }
}

echo json_encode([
    "success" => true,
    "data" => $data
]);
