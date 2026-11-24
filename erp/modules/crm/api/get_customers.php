<?php

header("Content-Type: application/json");

require_once "db.php";

$sql = "SELECT
            id,
            nama,
            email,
            no_hp,
            instansi,
            status_prospek
        FROM crm_customers
        ORDER BY id DESC";

$result = $conn->query($sql);

if (!$result) {

    echo json_encode([
        "success" => false,
        "message" => $conn->error
    ]);

    exit;
}

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $data
]);