<?php

header('Content-Type: application/json');

require_once 'db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

if (!in_array($_SESSION['role_name'] ?? '', ['Superadmin', 'CRM'], true)) {

    echo json_encode([
        'success' => false,
        'message' => 'Akses ditolak.'
    ]);

    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    echo json_encode([
        'success' => false,
        'message' => 'Method harus POST'
    ]);

    exit;
}

$nama            = trim($_POST['nama'] ?? '');
$email           = trim($_POST['email'] ?? '');
$no_hp           = trim($_POST['no_hp'] ?? '');
$instansi        = trim($_POST['instansi'] ?? '');
$minat_produk    = trim($_POST['minat_produk'] ?? '');
$tipe            = trim($_POST['tipe'] ?? 'lead');
$status_prospek  = trim($_POST['status_prospek'] ?? 'cold');

$password = $_POST['password'] ?? 'customer123';

if (
    $nama == '' ||
    $email == '' ||
    $no_hp == ''
) {

    echo json_encode([
        'success' => false,
        'message' => 'Nama, Email dan No HP wajib diisi.'
    ]);

    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

    echo json_encode([
        'success' => false,
        'message' => 'Format email tidak valid.'
    ]);

    exit;
}

$tipeValid = ['lead','client','partner','alumni'];

if (!in_array($tipe, $tipeValid, true)) {
    $tipe = 'lead';
}

$statusValid = ['cold','warm','hot','deal','lost'];

if (!in_array($status_prospek, $statusValid, true)) {
    $status_prospek = 'cold';
}

$stmt = $conn->prepare(
    "SELECT id FROM crm_customers
     WHERE email=?
     LIMIT 1"
);

$stmt->bind_param("s", $email);

$stmt->execute();

$result = $stmt->get_result();

if ($result->fetch_assoc()) {

    echo json_encode([
        'success' => false,
        'message' => 'Email sudah terdaftar.'
    ]);

    $stmt->close();

    exit;
}

$stmt->close();

$password_hash = password_hash(
    $password,
    PASSWORD_BCRYPT
);

$stmt = $conn->prepare(

    "INSERT INTO crm_customers
    (
        nama,
        email,
        no_hp,
        instansi,
        minat_produk,
        password_hash,
        tipe,
        status_prospek
    )

    VALUES
    (
        ?,?,?,?,?,?,?,?
    )"

);

$stmt->bind_param(

    "ssssssss",

    $nama,
    $email,
    $no_hp,
    $instansi,
    $minat_produk,
    $password_hash,
    $tipe,
    $status_prospek

);

if($stmt->execute()){

    echo json_encode([

        "success"=>true,

        "message"=>"Customer berhasil ditambahkan.",

        "id"=>$conn->insert_id

    ]);

}else{

    echo json_encode([

        "success"=>false,

        "message"=>$stmt->error

    ]);

}

$stmt->close();

$conn->close();