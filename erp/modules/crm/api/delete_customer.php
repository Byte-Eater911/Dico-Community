<?php

header("Content-Type: application/json");

require_once "db.php";

$id = intval($_POST['id'] ?? 0);

if($id == 0){

    echo json_encode([
        "success" => false,
        "message" => "ID Customer tidak valid."
    ]);

    exit;

}

$stmt = $conn->prepare("DELETE FROM crm_customers WHERE id=?");

$stmt->bind_param("i", $id);

if($stmt->execute()){

    echo json_encode([
        "success" => true,
        "message" => "Customer berhasil dihapus."
    ]);

}else{

    echo json_encode([
        "success" => false,
        "message" => $stmt->error
    ]);

}

$stmt->close();
$conn->close();