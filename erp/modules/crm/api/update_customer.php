<?php

header("Content-Type: application/json");

require_once "db.php";

$id               = intval($_POST['id'] ?? 0);
$nama             = trim($_POST['nama'] ?? '');
$email            = trim($_POST['email'] ?? '');
$no_hp            = trim($_POST['no_hp'] ?? '');
$instansi         = trim($_POST['instansi'] ?? '');
$minat_produk     = trim($_POST['minat_produk'] ?? '');
$status_prospek   = trim($_POST['status_prospek'] ?? '');

if($id==0){

    echo json_encode([
        "success"=>false,
        "message"=>"ID Customer tidak ditemukan."
    ]);

    exit;

}

$stmt = $conn->prepare("
UPDATE crm_customers
SET
    nama=?,
    email=?,
    no_hp=?,
    instansi=?,
    minat_produk=?,
    status_prospek=?
WHERE id=?
");

$stmt->bind_param(
    "ssssssi",
    $nama,
    $email,
    $no_hp,
    $instansi,
    $minat_produk,
    $status_prospek,
    $id
);

if($stmt->execute()){

    echo json_encode([
        "success"=>true,
        "message"=>"Customer berhasil diperbarui."
    ]);

}else{

    echo json_encode([
        "success"=>false,
        "message"=>$stmt->error
    ]);

}

$stmt->close();
$conn->close();