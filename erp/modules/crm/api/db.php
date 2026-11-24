<?php

$host     = "localhost";
$username = "root";
$password = "";
$db = "dico_community";

$conn = new mysqli($host, $username, $password, $db);

if ($conn->connect_errno) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Koneksi database gagal.",
        "error"   => $conn->connect_error
    ]);

    exit;
}

$conn->set_charset("utf8");