<?php

header("Content-Type: application/json");
require_once "db.php";

$id = intval($_POST["id"] ?? 0);
$customer_id = intval($_POST["customer_id"] ?? 0);
$tipe_kontak = trim($_POST["tipe_kontak"] ?? "");
$catatan = trim($_POST["catatan"] ?? "");

if($id==0 || $customer_id==0 || $tipe_kontak=="" || $catatan==""){

    echo json_encode([
        "success"=>false,
        "message"=>"Semua field wajib diisi."
    ]);

    exit;

}

$stmt = $conn->prepare("
UPDATE crm_interactions
SET
customer_id=?,
tipe_kontak=?,
catatan=?
WHERE id=?
");

$stmt->bind_param(
"issi",
$customer_id,
$tipe_kontak,
$catatan,
$id
);

if($stmt->execute()){

    echo json_encode([
        "success"=>true,
        "message"=>"Interaksi berhasil diupdate."
    ]);

}else{

    echo json_encode([
        "success"=>false,
        "message"=>"Gagal update."
    ]);

}

$stmt->close();
$conn->close();