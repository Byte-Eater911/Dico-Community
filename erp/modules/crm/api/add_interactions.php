<?php

header('Content-Type: application/json');
session_start();

require_once 'db.php';

if($_SERVER['REQUEST_METHOD'] != 'POST'){
    echo json_encode([
        "success"=>false,
        "message"=>"Method tidak diizinkan."
    ]);
    exit;
}

$customer_id = $_POST['customer_id'] ?? '';
$tipe_kontak = trim($_POST['tipe_kontak'] ?? '');
$catatan     = trim($_POST['catatan'] ?? '');

$user_id = $_SESSION['user_id'] ?? 1;

if($customer_id=='' || $tipe_kontak=='' || $catatan==''){
    echo json_encode([
        "success"=>false,
        "message"=>"Semua field wajib diisi."
    ]);
    exit;
}

$stmt = $conn->prepare("
INSERT INTO crm_interactions
(customer_id,user_id,tipe_kontak,catatan)
VALUES (?,?,?,?)
");

$stmt->bind_param(
    "iiss",
    $customer_id,
    $user_id,
    $tipe_kontak,
    $catatan
);

if($stmt->execute()){

    echo json_encode([
        "success"=>true,
        "message"=>"Interaksi berhasil ditambahkan."
    ]);

}else{

    echo json_encode([
        "success"=>false,
        "message"=>$stmt->error
    ]);

}

$stmt->close();
$conn->close();