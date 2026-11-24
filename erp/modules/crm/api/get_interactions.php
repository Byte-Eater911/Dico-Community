<?php

header("Content-Type: application/json");

require_once "db.php";

$sql = "
SELECT
    i.id,
    c.nama,
    c.email,
    i.tipe_kontak AS keperluan,
    i.catatan AS pesan
FROM crm_interactions i
LEFT JOIN crm_customers c
ON i.customer_id = c.id
ORDER BY i.id DESC
";

$result = $conn->query($sql);

$data = [];

while($row = $result->fetch_assoc()){
    $data[] = $row;
}

echo json_encode([
    "success"=>true,
    "data"=>$data
]);