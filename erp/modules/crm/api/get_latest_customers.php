<?php

header("Content-Type: application/json");

require_once "db.php";

$sql = "
SELECT
    nama,
    email,
    instansi
FROM crm_customers
ORDER BY id DESC
LIMIT 5
";

$result = $conn->query($sql);

$data = [];

while($row = $result->fetch_assoc()){
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $data
]);