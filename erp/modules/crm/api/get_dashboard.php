<?php

header("Content-Type: application/json");

require_once "db.php";

$response = [
    "success" => true,
    "total_customer" => 0,
    "total_interaksi" => 0,
    "total_registrasi" => 0
];

$q1 = $conn->query("SELECT COUNT(*) AS total FROM crm_customers");
if($q1){
    $response["total_customer"] = $q1->fetch_assoc()["total"];
}

$q2 = $conn->query("SELECT COUNT(*) AS total FROM crm_interactions");
if($q2){
    $response["total_interaksi"] = $q2->fetch_assoc()["total"];
}

echo json_encode($response);

$conn->close();