<?php

header("Content-Type: application/json");
require_once "db.php";

$id = intval($_GET['id'] ?? 0);

$sql = "
SELECT
    id,
    customer_id,
    tipe_kontak,
    catatan
FROM crm_interactions
WHERE id = ?
LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i",$id);
$stmt->execute();

$result = $stmt->get_result();

if($result->num_rows == 0){

    echo json_encode([
        "success"=>false,
        "message"=>"Data tidak ditemukan."
    ]);

    exit;
}

echo json_encode([
    "success"=>true,
    "data"=>$result->fetch_assoc()
]);

$stmt->close();
$conn->close();